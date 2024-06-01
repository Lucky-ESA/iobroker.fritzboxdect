const EventEmitter = require("events");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const xml2js = require("xml2js");
const entities = require("entities");
const axios = require("axios");
const https = require("https");
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

/**
 *
 * @extends EventEmitter
 */
class TR064 extends EventEmitter {
    constructor(config, adapter) {
        super();
        this.adapter = adapter;
        this.config = config;
        this.updateInterval = null;
        this.services = [];
        this.checkvalue = {};
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalizeTags: true,
            ignoreAttrs: true,
        });
        const data = {};
        if (config.protocol === "https") {
            data.agent = httpsAgent;
        }
        data.baseURL = `${config.protocol}://${config.ip}:49000`;
        this.requestClient = axios.create({
            withCredentials: true,
            timeout: 5000,
            headers: { "Content-Type": 'text/xml; charset="utf-8"' },
            ...data,
        });
    }

    async start() {
        let commandURL = await this.requestClient({
            method: "GET",
            url: "/tr64desc.xml",
        })
            .then(async (res) => {
                if (res.data) {
                    return res.data;
                } else {
                    return res;
                }
            })
            .catch((error) => {
                return error;
            });
        this.updateInterval && this.adapter.clearInterval(this.updateInterval);
        if (commandURL != null && typeof commandURL === "string" && commandURL.indexOf("serviceList") != -1) {
            commandURL = commandURL.toString().replace(/\n/g, "");
            this.parser
                .parseStringPromise(commandURL)
                .then((result) => {
                    if (
                        result &&
                        result.root &&
                        result.root.device &&
                        result.root.device.servicelist &&
                        result.root.device.servicelist.service
                    ) {
                        this.services = this.services.concat(result.root.device.servicelist.service);
                    }
                    if (
                        result &&
                        result.root &&
                        result.root.device &&
                        result.root.device.devicelist &&
                        result.root.device.devicelist.device
                    ) {
                        for (const device of result.root.device.devicelist.device) {
                            if (device && device.servicelist && device.servicelist.service) {
                                this.services = this.services.concat(device.servicelist.service);
                            }
                            if (
                                device &&
                                device.devicelist &&
                                device.devicelist.device.servicelist &&
                                device.devicelist.device.servicelist.service
                            ) {
                                this.services = this.services.concat(device.devicelist.device.servicelist.service);
                            }
                        }
                    }
                    if (this.services.length > 0) {
                        this.adapter.setState(
                            `${this.config.dp}.TR_064.States.sendCommandPossible`,
                            JSON.stringify(this.services),
                            true,
                        );
                    }
                })
                .catch((err) => {
                    this.adapter.log.warn(err);
                });
            this.updateTR064();
            this.updateTR064Wlan();
            if (this.config.tr_interval > 0) {
                this.adapter.log.info(`Start TR-064 interval with ${this.config.tr_interval} Minute(s)`);
                this.startupdateTR064();
            }
        }
    }

    async startupdateTR064() {
        this.updateInterval = this.adapter.setInterval(
            async () => {
                this.updateTR064();
                this.updateTR064Wlan();
            },
            60 * this.config.tr_interval * 1000,
        );
    }

    async updateTR064Wlan() {
        const wlan = {
            link: "/upnp/control/wlanconfig",
            service: "urn:dslforum-org:service:WLANConfiguration:",
            action: "GetInfo",
        };
        const dp = {
            1: `${this.config.dp}.TR_064.States.wlan24`,
            2: `${this.config.dp}.TR_064.States.wlan50`,
            3: `${this.config.dp}.TR_064.States.wlanguest`,
            4: `${this.config.dp}.TR_064.States.wlanguestname`,
        };
        for (let i = 1; i < 4; i++) {
            const wlan_resp = await this.requests(`${wlan.link}${i}`, `${wlan.service}${i}`, `${wlan.action}`, "");
            this.adapter.log.debug("WLAN: " + wlan_resp);
            if (wlan_resp != null && typeof wlan_resp === "string" && wlan_resp.indexOf("NewEnable") != -1) {
                const wlan_status = wlan_resp.match("<NewEnable>(.*?)</NewEnable>");
                if (wlan_status != null && wlan_status[1] != null) {
                    if (!this.checkvalue[dp[i]] || this.checkvalue[dp[i]] != wlan_status[1]) {
                        await this.adapter.setStateAsync(dp[i], wlan_status[1] == "1" ? true : false, true);
                    }
                }
                if (i === 3) {
                    const wlan_g_name = wlan_resp.match("<NewSSID>(.*?)</NewSSID>");
                    if (wlan_g_name != null && wlan_g_name[1] != null) {
                        if (!this.checkvalue[dp["4"]] || this.checkvalue[dp["4"]] != wlan_g_name[1]) {
                            await this.adapter.setStateAsync(dp["4"], wlan_g_name[1], true);
                        }
                    }
                }
            }
        }
    }

    async updateTR064() {
        const device = await this.requests(
            "/upnp/control/deviceinfo",
            "urn:dslforum-org:service:DeviceInfo:1",
            "GetInfo",
            "",
        );
        this.adapter.log.debug(`RESULTDEVICE: ${device}`);
        if (device != null && typeof device === "string" && device.indexOf("GetInfoResponse") != -1) {
            this.parser
                .parseStringPromise(device)
                .then((result) => {
                    this.adapter.log.debug(`RESULTDEVICE: ${JSON.stringify(result)}`);
                    if (
                        result &&
                        result["s:envelope"] &&
                        result["s:envelope"]["s:body"] &&
                        result["s:envelope"]["s:body"]["u:getinforesponse"]
                    ) {
                        const val = result["s:envelope"]["s:body"]["u:getinforesponse"];
                        if (val.newhardwareversion) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.hardware`,
                                val.newhardwareversion,
                                true,
                            );
                        }
                        if (val.newserialnumber) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.serialnumber`,
                                val.newserialnumber,
                                true,
                            );
                        }
                        if (val.newsoftwareversion) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.firmware`,
                                val.newsoftwareversion.toString(),
                                true,
                            );
                        }
                        if (val.newuptime) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.uptime`,
                                parseInt(val.newuptime),
                                true,
                            );
                        }
                        if (val.newdevicelog) {
                            const protocol = val.newdevicelog.split("\n");
                            const protocol_array = [];
                            if (protocol.length > 0) {
                                let count = 0;
                                for (const line of protocol) {
                                    const valText = {};
                                    valText[count] = Buffer.from(line, "ascii").toString();
                                    ++count;
                                    protocol_array.push(valText);
                                }
                                this.adapter.setState(
                                    `${this.config.dp}.TR_064.States.protocol`,
                                    JSON.stringify(protocol_array),
                                    true,
                                );
                            }
                        }
                    }
                })
                .catch((err) => {
                    this.adapter.log.warn(err);
                });
        }
        const infos = await this.requests(
            "/upnp/control/wanpppconn1",
            "urn:dslforum-org:service:WANPPPConnection:1",
            "GetInfo",
            "",
        );
        this.adapter.log.debug(`RESULTINFO: ${infos}`);
        if (device != null && typeof device === "string" && device.indexOf("GetInfoResponse") != -1) {
            this.parser
                .parseStringPromise(infos)
                .then((result) => {
                    this.adapter.log.debug(`RESULTINFO: ${JSON.stringify(result)}`);
                    if (
                        result &&
                        result["s:envelope"] &&
                        result["s:envelope"]["s:body"] &&
                        result["s:envelope"]["s:body"]["u:getinforesponse"]
                    ) {
                        const val = result["s:envelope"]["s:body"]["u:getinforesponse"];
                        this.adapter.log.debug(`RESULTINFO: ${JSON.stringify(val)}`);
                        if (val.newexternalipaddress) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.externalIPv4`,
                                val.newexternalipaddress.toString(),
                                true,
                            );
                        }
                        if (val.newdnsservers) {
                            const ips = val.newdnsservers.split(", ");
                            this.adapter.setState(`${this.config.dp}.TR_064.States.externalIPv6`, ips[0], true);
                            this.adapter.setState(`${this.config.dp}.TR_064.States.externalIPv6Prefix`, ips[1], true);
                        }
                        if (val.newmacaddress) {
                            this.adapter.setState(`${this.config.dp}.TR_064.States.mac`, val.newmacaddress, true);
                        }
                        if (val.newupstreammaxbitrate) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.upstream`,
                                parseInt(val.newupstreammaxbitrate),
                                true,
                            );
                        }
                        if (val.newdownstreammaxbitrate) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.downstream`,
                                parseInt(val.newdownstreammaxbitrate),
                                true,
                            );
                        }
                        if (val.newconnectionstatus) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.status`,
                                val.newconnectionstatus,
                                true,
                            );
                        }
                        if (val.newlastconnectionerror) {
                            this.adapter.setState(
                                `${this.config.dp}.TR_064.States.error`,
                                val.newlastconnectionerror,
                                true,
                            );
                        }
                    }
                })
                .catch((err) => {
                    this.adapter.log.warn(err);
                });
        }
        this.adapter.setState(`${this.config.dp}.TR_064.States.lastupdate`, Date.now(), true);
    }

    destroy() {
        this.updateInterval && this.adapter.clearInterval(this.updateInterval);
    }

    /**
     * @param {string} fritz
     * @param {string} state
     * @param {object | null | undefined} obj
     */
    async sendCommand(fritz, state, obj) {
        let resp = {};
        let val;
        let values = "";
        if (!state) {
            resp = { error: "Missing state!" };
        }
        try {
            if (typeof state !== "object") {
                val = JSON.parse(state);
            } else {
                val = state;
            }
            if (!val) {
                resp = { error: "Cannot parse state!" };
            }
        } catch (e) {
            resp = { error: JSON.stringify(e) };
        }
        if (Object.keys(resp).length === 0) {
            const device = this.services.find((dev) => dev.servicetype === val.service);
            if (!val.service) {
                resp = { error: "Missing servcie!" };
            } else if (!val.action) {
                resp = { error: "Missing action!" };
            } else if (!device) {
                resp = { error: "Missing URL!" };
            } else {
                if (val.params && Object.keys(val.params).length > 0) {
                    for (const param in val.params) {
                        values += `<${param}>${val.params[param]}</${param}>`;
                    }
                }
                let response = await this.requests(device.eventsuburl, val.service, val.action, values);
                if (val.tag != null && val.tag != "") {
                    const path = response.toString().match("<" + val.tag + ">(.*?)</" + val.tag + ">");
                    if (path != null && path[1] != null && !path[1].toUpperCase().startsWith("HTTP")) {
                        path[1] = `${this.config.protocol}://${this.config.ip}:49000${path[1]}`;
                    }
                    if (path != null && path[1] != null) {
                        response = await this.requests(path[1], null, null, null);
                    }
                } else if (val.link != null && val.link != "") {
                    response = await this.requests(val.link, null, null, null);
                }
                // Mesh-Topologie is a JSON String
                if (typeof response === "string" && response.indexOf("<?xml") != -1) {
                    response = response
                        .replace(/<s:/g, "<")
                        .replace(/<u:/g, "<")
                        .replace(/<\/s:/g, "</")
                        .replace(/<\/u:/g, "</");
                    resp = await this.parser
                        .parseStringPromise(response)
                        .then((result) => {
                            return result;
                        })
                        .catch((err) => {
                            return { error: err };
                        });
                    if (val.html) {
                        response = entities.decodeHTML(response.toString());
                    }
                } else {
                    resp = response;
                }
                this.adapter.setState(`${this.config.dp}.TR_064.States.responseXML`, response.toString(), true);
                if (obj != null) {
                    this.adapter.sendTo(obj.from, obj.command, JSON.stringify(resp), obj.callback);
                }
            }
        } else {
            if (obj != null) {
                this.adapter.sendTo(obj.from, obj.command, resp, obj.callback);
            }
        }
        this.adapter.setState(`${this.config.dp}.TR_064.States.response`, JSON.stringify(resp), true);
    }

    async requests(request, service, action, params) {
        if (service) {
            request = `curl -s --anyauth --user "${this.config.user}:${this.config.password}" \
            "http://${this.config.ip}:49000${request}" \
            -H 'Content-Type: text/xml; charset="utf-8"' \
            -H 'SoapAction:${service}#${action}' \
            -d '<?xml version="1.0" encoding="utf-8"?>
                <s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
                    xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
                   <s:Body>
                  <u:${action} xmlns:u='${service}'>${params}
                </u:${action}>
                   </s:Body>
                </s:Envelope>'`;
        } else {
            request = `curl -s --anyauth --user "${this.config.user}:${this.config.password}" \
            "${request}" \
            -H 'Content-Type: text/xml; charset="utf-8"'`;
        }
        return await exec(request).then(
            (out) => {
                this.adapter.log.debug("OUT: " + out.stdout + " - " + out.stderr);
                try {
                    if (out.stdout) {
                        return out.stdout;
                    } else {
                        if (out.stdout.toString().indexOf("Unauthorized") !== -1) {
                            return "Unauthorized";
                        }
                        return out.stdout;
                    }
                } catch (e) {
                    this.adapter.log.debug(`catch exec: ${JSON.stringify(e)}`);
                    return false;
                }
            },
            (err) => {
                this.adapter.log.debug(`requests: ${JSON.stringify(err)}`);
                return false;
            },
        );
    }
}

module.exports = TR064;
