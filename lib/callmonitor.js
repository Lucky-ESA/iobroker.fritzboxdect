const EventEmitter = require("events");
const { createInterface } = require("readline");
const { Socket } = require("net");
const calllist = require("./calllist");
const datePattern = /(\d{2})\.(\d{2})\.(\d{2})\s+?(\d{2}):(\d{2}):(\d{2})/gi;

/*
# Respsonse Format

Outbound:
Date;CALL;ConnectionId;Extension;CallerId;CalledPhoneNumber;
datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;

Inbound:
Date;RING;ConnectionId;CallerId;CalledPhoneNumber;
datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;

Connected:
Date;CONNECT;ConnectionId;Extension;Number;
datum;CONNECT;ConnectionID;Nebenstelle;Nummer;

Disconnected:
Date;DISCONNECT;ConnectionID;DurationInSeconds;
datum;DISCONNECT;ConnectionID;dauerInSekunden;
Nebenstelle  Interne Anwahl    Beschreibung
1 ... 3      **1 ... **3       Analoge Endgeräte an FON1 ... FON3
4            **51 ... **58     ISDN-Gerät an internem S0. Mehrere S0-Geräte werden leider nicht unterschieden
5                              Integrierter Faxempfang bzw. Versand mit Fritz!Fax4Box
10 ... 19 	 **610 ... **619   DECT-Telefone (bis zu 6) und FRITZ! Mini (die verbleibenden)
20 ... 29 	 **620 ... **629   VoIP-Telefone an LAN oder WLAN
40 ... 44 	 **600 ... **604   Integrierte Anrufbeantworter
*/

/**
 *
 * @extends EventEmitter
 */
class Callmonitor extends EventEmitter {
    constructor(config, adapter, constants) {
        super();
        this.adapter = adapter;
        this.config = config;
        this.constants = constants;
        this.port = 1012;
        this.host = config.ip;
        this.socket = new Socket();
        this.callList = new calllist(config, adapter, constants);
        this.phonelist = null;
        this.call_events = {};
    }

    async connect() {
        await this.callList.getCountry();
        this.phonelist = await this.callList.getPhoneBook();
        if (this.config.calllist > 0) {
            await this.callList.getCallList();
        }
        this.adapter.log.debug(JSON.stringify(this.phonelist));
        const s = this.socket;

        s.on("connect", () => {
            this.adapter.setState(`${this.config.dp}.TR_064.Callmonitor.status`, true, true);
            const reader = createInterface({
                input: this.socket,
            });
            reader.on("line", (l) => this.processLine(l));
            s.once("close", () => reader.close());
            this.emit("connect");
        });
        s.on("end", () => {
            this.setStatus(false);
            this.emit("end");
        });
        s.on("timeout", () => {
            this.setStatus(false);
            this.emit("timeout");
        });
        s.on("error", (err) => {
            this.setStatus(false);
            this.emit("error", err);
        });
        s.on("close", (had_error) => {
            this.setStatus(false);
            this.emit("close", had_error);
        });

        s.connect(this.port, this.host);
    }

    setStatus(val) {
        this.adapter.setState(`${this.config.dp}.TR_064.Callmonitor.status`, val, true);
    }

    processLine(line) {
        const data = this.parseLine(line);
        this.adapter.log.debug(`LINE: ${line}`);
        this.adapter.log.debug(`DATA: ${JSON.stringify(data)}`);
        if (data) {
            this.adapter.setState(`${this.config.dp}.TR_064.Callmonitor.calldata`, JSON.stringify(data), true);
        }
    }

    parseLine(line) {
        if (!line) return null;
        const sp = line.split(";");
        if (sp.length < 4) return { error: "error" };
        if (!this.call_events[sp[2]]) {
            this.call_events[sp[2]] = {
                lastrawdata: "",
                rawdata: [],
                date: "",
                id: parseInt(sp[2]),
                timestamp: 0,
                kind: "",
                extension: 0,
                caller: "",
                callername: "",
                called: "",
                calledname: "",
                sip: "",
                duration: 0,
                type: sp[1],
                prefix: 0,
                state: "",
            };
        }
        const dateMatch = datePattern.exec(sp[0]);
        let date;
        if (dateMatch !== null) {
            const [, dayOfMonth, month1Based, year, hours, minutes, seconds] = dateMatch;
            date = new Date(
                Number(year) + 2000,
                Number(month1Based) - 1,
                Number(dayOfMonth),
                Number(hours),
                Number(minutes),
                Number(seconds),
                0,
            );
        } else {
            date = new Date();
        }
        const evt = this.eventTypeFromString(sp[1]);
        if (evt === undefined) return null;
        const connId = parseInt(sp[2]);
        return this.createEvent(evt, date, connId, line, sp);
    }

    createEvent(evt, date, connectionId, line, splitLines) {
        this.call_events[connectionId].lastrawdata = line;
        this.call_events[connectionId].rawdata.push(line);
        this.call_events[connectionId].date = date;
        this.call_events[connectionId].timestamp = Date.now();
        this.adapter.log.info("HALLO: " + line);
        switch (evt) {
            case "HangUp":
                this.call_events[connectionId].kind = evt;
                this.call_events[connectionId].duration = parseInt(splitLines[3]);
                this.setStates("lastcall", this.call_events[connectionId], connectionId);
                this.callList.getCallList();
                return this.call_events[connectionId];
            case "Call":
                this.call_events[connectionId].kind = evt;
                this.call_events[connectionId].extension = parseInt(splitLines[3]);
                this.call_events[connectionId].caller = splitLines[4].replace(/#/g, "");
                this.call_events[connectionId].called = splitLines[5].replace(/#/g, "");
                this.call_events[connectionId].sip = splitLines[6];
                this.setStates("outbound", this.call_events[connectionId], connectionId);
                return this.setStatesPrefix(connectionId, splitLines[5]);
            case "PickUp":
                this.call_events[connectionId].kind = evt;
                this.call_events[connectionId].called = splitLines[4].replace(/#/g, "");
                this.call_events[connectionId].extension = parseInt(splitLines[3]);
                this.setStates("connect", this.call_events[connectionId], connectionId);
                return this.call_events[connectionId];
            case "Ring":
                this.call_events[connectionId].duration = 0;
                this.call_events[connectionId].extension = 0;
                this.call_events[connectionId].kind = evt;
                this.call_events[connectionId].called = splitLines[4].replace(/#/g, "");
                this.call_events[connectionId].caller = splitLines[3].replace(/#/g, "");
                this.call_events[connectionId].sip = splitLines[5];
                this.setStates("inbound", this.call_events[connectionId], connectionId);
                return this.setStatesPrefix(connectionId, splitLines[4]);
        }
    }

    setStatesPrefix(id, phonenumber) {
        this.adapter.log.info("HALLO: " + phonenumber);
        if (!phonenumber.startsWith("00") && phonenumber.startsWith("0")) {
            this.adapter.log.info("HALLO1: " + phonenumber);
            if (this.constants[`Z${phonenumber.substring(0, 6)}`]) {
                this.call_events[id].prefix = phonenumber.substring(0, 6);
                this.call_events[id].state = this.constants[`Z${phonenumber.substring(0, 6)}`];
            } else if (this.constants[`Z${phonenumber.substring(0, 5)}`]) {
                this.call_events[id].prefix = phonenumber.substring(0, 5);
                this.call_events[id].state = this.constants[`Z${phonenumber.substring(0, 5)}`];
            } else if (this.constants[`Z${phonenumber.substring(0, 4)}`]) {
                this.call_events[id].prefix = phonenumber.substring(0, 4);
                this.call_events[id].state = this.constants[`Z${phonenumber.substring(0, 4)}`];
            } else if (this.constants[`Z${phonenumber.substring(0, 3)}`]) {
                this.call_events[id].prefix = phonenumber.substring(0, 3);
                this.call_events[id].state = this.constants[`Z${phonenumber.substring(0, 3)}`];
            }
        }
        this.adapter.log.info("HALLO2: " + this.call_events[id].state);
        this.adapter.log.info("HALLO3: " + this.call_events[id].prefix);
        return this.call_events[id];
    }

    eventTypeFromString(ev) {
        switch (ev.toUpperCase()) {
            case "RING":
                return "Ring";
            case "CALL":
                return "Call";
            case "CONNECT":
                return "PickUp";
            case "DISCONNECT":
                return "HangUp";
            default:
                return undefined;
        }
    }

    async setStates(folder, val, connectionId) {
        if (val.called != null) {
            if (this.phonelist != null && val.calledname == "") {
                if (this.phonelist[val.called]) {
                    val.calledname = this.phonelist[val.called];
                } else if (this.phonelist[this.callList.getCountryCode(val.called)]) {
                    val.calledname = this.phonelist[this.callList.getCountryCode(val.called)];
                } else {
                    for (const phonenr in this.phonelist) {
                        if (this.phoneNumbersMatch(val.called, phonenr)) {
                            val.calledname = this.phonelist[phonenr];
                            break;
                        }
                    }
                    if (val.calledname == "") {
                        val.calledname = "Unknwon";
                    }
                }
            }
            if (val.calledname == "") val.calledname = "Unknown";
            await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Callmonitor.${folder}.called`, val.called, true);
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Callmonitor.${folder}.calledname`,
                val.calledname,
                true,
            );
        }
        if (val.caller != null) {
            if (this.phonelist != null && val.callername == "") {
                if (this.phonelist[val.caller]) {
                    val.callername = this.phonelist[val.caller];
                } else if (this.phonelist[this.callList.getCountryCode(val.caller)]) {
                    val.callername = this.phonelist[this.callList.getCountryCode(val.caller)];
                } else {
                    for (const phonenr in this.phonelist) {
                        if (this.phoneNumbersMatch(val.caller, phonenr)) {
                            val.callername = this.phonelist[phonenr];
                            break;
                        }
                    }
                    if (val.calledname == "") {
                        val.calledname = "Unknwon";
                    }
                }
            }
            if (val.callername == "") val.callername = "Unknown";
            await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Callmonitor.${folder}.caller`, val.caller, true);
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Callmonitor.${folder}.callername`,
                val.callername,
                true,
            );
        }
        if (val.extension != null) {
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Callmonitor.${folder}.extension`,
                val.extension,
                true,
            );
        }
        if (val.duration != null && folder == "lastcall") {
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Callmonitor.${folder}.duration`,
                val.duration,
                true,
            );
        }
        await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Callmonitor.${folder}.id`, val.id, true);
        await this.adapter.setStateAsync(
            `${this.config.dp}.TR_064.Callmonitor.${folder}.timestamp`,
            val.timestamp,
            true,
        );
        await this.adapter.setStateAsync(
            `${this.config.dp}.TR_064.Callmonitor.${folder}.json`,
            JSON.stringify(val),
            true,
        );
        await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Callmonitor.${folder}.type`, val.kind, true);
        await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Callmonitor.${folder}.sip`, val.sip, true);
        if (folder == "lastcall") this.call_events[connectionId] = null;
    }

    phoneNumbersMatch(nr1, nr2) {
        // Remove non-digits and leading zeroes and leading pluses
        nr1 = nr1.replace(/[^0-9+]/g, "").replace(/^[0+]+/, "");
        nr2 = nr2.replace(/[^0-9+]/g, "").replace(/^[0+]+/, "");
        return nr1.indexOf(nr2) >= 0 || nr2.indexOf(nr1) >= 0;
    }

    destroy() {
        this.socket.end();
        this.callList.destroy();
    }
}

module.exports = Callmonitor;
