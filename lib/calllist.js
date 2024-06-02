const EventEmitter = require("events");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const xml2js = require("xml2js");
const entities = require("entities");

/**
 *
 * @extends EventEmitter
 */
class Calllist extends EventEmitter {
    constructor(config, adapter) {
        super();
        this.adapter = adapter;
        this.config = config;
        this.baseURL = `${config.protocol}://${config.ip}:49000`;
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalizeTags: true,
            ignoreAttrs: true,
        });
        this.country = {};
        this.phonebook = {};
    }

    async getCallList() {
        const callLists = await this.requests(
            "/upnp/control/x_contact",
            "urn:dslforum-org:service:X_AVM-DE_OnTel:1",
            "GetCallList",
            "",
        );
        this.adapter.log.debug(`getCallLists: ${callLists}`);
        if (callLists != null && typeof callLists === "string" && callLists.indexOf("NewCallListURL") != -1) {
            const path = callLists.match("<NewCallListURL>(.*?)</NewCallListURL>");
            if (path != null && path[1] != null) {
                this.adapter.log.debug(`LINK: ${path[1]}`);
                let callList = await this.requests(path[1], null, null, null);
                callList = callList.toString().replace(/\n/g, "");
                this.parser
                    .parseStringPromise(callList)
                    .then((result) => {
                        this.adapter.log.debug(`RESULTCALLLIST: ${JSON.stringify(result)}`);
                        this.createCallList(result);
                    })
                    .catch((err) => {
                        this.adapter.log.warn(err);
                    });
            }
        }
    }

    async createCallList(result) {
        const arr_missed = [];
        const arr_inbound = [];
        const arr_outbound = [];
        const arr_other = [];
        const max_count = this.config.calllist + 1;
        let count_missed = 0;
        let count_inbound = 0;
        let count_outbound = 0;
        let count_other = 0;
        if (result && result.root && result.root.call && Array.isArray(result.root.call)) {
            for (const call of result.root.call) {
                call.device = Buffer.from(call.device, "utf8").toString();
                call.name = Buffer.from(call.name, "utf8").toString();
                if (call.type == "1") {
                    ++count_inbound;
                } else if (call.type == "2") {
                    ++count_missed;
                } else if (call.type == "3") {
                    ++count_outbound;
                } else {
                    ++count_other;
                }
                if (call.type == "1" && count_inbound < max_count) {
                    call.sym = ">";
                    arr_inbound.push(call);
                } else if (call.type == "2" && count_missed < max_count) {
                    call.sym = "x";
                    arr_missed.push(call);
                } else if (call.type == "3" && count_outbound < max_count) {
                    call.sym = "<";
                    arr_outbound.push(call);
                } else if (call.type != "3" && call.type != "2" && call.type != "1") {
                    call.sym = "o";
                    arr_other.push(call);
                }
            }
            this.adapter.log.debug(`Ohter Type: ${count_other}`);
            await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Calllists.incomming.count`, count_inbound, true);
            await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Calllists.outgoing.count`, count_outbound, true);
            await this.adapter.setStateAsync(`${this.config.dp}.TR_064.Calllists.missed.count`, count_missed, true);
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Calllists.incomming.json`,
                JSON.stringify(arr_inbound),
                true,
            );
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Calllists.outgoing.json`,
                JSON.stringify(arr_outbound),
                true,
            );
            await this.adapter.setStateAsync(
                `${this.config.dp}.TR_064.Calllists.missed.json`,
                JSON.stringify(arr_missed),
                true,
            );
        }
    }

    async getCountry() {
        const countryCode = await this.requests(
            "/upnp/control/x_voip",
            "urn:dslforum-org:service:X_VoIP:1",
            "X_AVM-DE_GetVoIPCommonCountryCode",
            "",
        );
        if (countryCode != null && typeof countryCode === "string" && countryCode.indexOf("NewX_AVM-DE_LKZ") != -1) {
            const cc = countryCode.match("<NewX_AVM-DE_LKZ>(.*?)</NewX_AVM-DE_LKZ>");
            if (cc != null && cc[1] != null) {
                this.country["country"] = cc[1];
            }
            if (countryCode.indexOf("NewX_AVM-DE_LKZPrefix") != -1) {
                const pcc = countryCode.match("<NewX_AVM-DE_LKZPrefix>(.*?)</NewX_AVM-DE_LKZPrefix>");
                if (pcc != null && pcc[1] != null) {
                    this.country["country"] = pcc[1] + this.country["country"];
                }
            }
        }
        const areaCode = await this.requests(
            "/upnp/control/x_voip",
            "urn:dslforum-org:service:X_VoIP:1",
            "X_AVM-DE_GetVoIPCommonAreaCode",
            null,
        );
        if (areaCode != null && typeof areaCode === "string" && areaCode.indexOf("NewX_AVM-DE_OKZ") != -1) {
            const ac = areaCode.match("<NewX_AVM-DE_OKZ>(.*?)</NewX_AVM-DE_OKZ>");
            if (ac && ac[1]) {
                this.country["area"] = ac[1];
            } else {
                this.country["area"] = "49";
            }
            if (areaCode.indexOf("NewX_AVM-DE_OKZPrefix") != -1) {
                const pac = areaCode.match("<NewX_AVM-DE_OKZPrefix>(.*?)</NewX_AVM-DE_OKZPrefix>");
                if (pac && pac[1]) {
                    this.country["area"] = pac[1] + this.country["area"];
                } else {
                    this.country["area"] = "00" + this.country["area"];
                }
            }
        }
        return true;
    }

    async getVIOPStatus() {
        const all_phonenumber = await this.requests(
            "/upnp/control/x_voip",
            "urn:dslforum-org:service:X_VoIP:1",
            "X_AVM-DE_GetVoIPAccounts",
            null,
        );
        this.adapter.log.info(JSON.stringify(all_phonenumber));
        // <NewVoIPAccountIndex>0</NewVoIPAccountIndex>
        // X_AVM-DE_GetVoIPAccount
    }

    async getPhoneBook() {
        const phonebookNr = await this.requests(
            "/upnp/control/x_contact",
            "urn:dslforum-org:service:X_AVM-DE_OnTel:1",
            "GetPhonebookList",
            "",
        );
        const phoneNumber = {};
        this.adapter.log.debug(phonebookNr);
        if (phonebookNr != null && typeof phonebookNr === "string" && phonebookNr.indexOf("NewPhonebookList") != -1) {
            const pbt = phonebookNr.match("<NewPhonebookList>(.*?)</NewPhonebookList>");
            if (pbt && pbt[1]) {
                const pb = pbt[1].split(",");
                if (pb && pb.length > 0) {
                    for (const pb_id of pb) {
                        const phonebookList = await this.requests(
                            "/upnp/control/x_contact",
                            "urn:dslforum-org:service:X_AVM-DE_OnTel:1",
                            "GetPhonebook",
                            "<NewPhonebookID>" + pb_id + "</NewPhonebookID>",
                        );
                        phoneNumber[pb_id] = {};
                        this.adapter.log.debug(phonebookList);
                        if (
                            phonebookList &&
                            typeof phonebookList === "string" &&
                            phonebookList.indexOf("NewPhonebookURL") != -1
                        ) {
                            const path = phonebookList.match("<NewPhonebookURL>(.*?)</NewPhonebookURL>");
                            if (path && path[1]) {
                                const pname = phonebookList.match("<NewPhonebookName>(.*?)</NewPhonebookName>");
                                this.adapter.log.debug(path[1]);
                                if (pname && pname[1]) {
                                    this.phonebook[pb_id] = entities.decodeHTML(pname[1]);
                                    let phoneList = await this.requests(entities.decodeHTML(path[1]), null, null, null);
                                    phoneList = phoneList.toString().replace(/\n/g, "");
                                    phoneNumber[pb_id] = await this.parser
                                        .parseStringPromise(phoneList)
                                        .then((result) => {
                                            this.adapter.log.debug(JSON.stringify(result));
                                            return result;
                                        })
                                        .catch((err) => {
                                            this.adapter.log.warn(err);
                                            return {};
                                        });
                                }
                            }
                        }
                    }
                }
            }
            const contactname = {};
            const phonebook_state = [];
            if (Object.keys(phoneNumber).length > 0) {
                for (const attr in phoneNumber) {
                    let bookname = " (" + attr + ")";
                    if (this.phonebook[attr]) {
                        bookname = " (" + Buffer.from(this.phonebook[attr], "ascii").toString() + ")";
                    }
                    if (
                        phoneNumber[attr] &&
                        phoneNumber[attr].phonebooks &&
                        phoneNumber[attr].phonebooks.phonebook &&
                        phoneNumber[attr].phonebooks.phonebook.contact &&
                        Array.isArray(phoneNumber[attr].phonebooks.phonebook.contact)
                    ) {
                        const contacts = phoneNumber[attr].phonebooks.phonebook.contact;
                        for (const contact of contacts) {
                            if (contact) {
                                const name =
                                    contact.person && contact.person.realname
                                        ? Buffer.from(contact.person.realname, "ascii").toString()
                                        : "";
                                const contact_json = {
                                    category: contact.category ? contact.category : "",
                                    realname: name,
                                    uniqueid: contact.uniqueid ? contact.uniqueid : "",
                                    email: contact.telephony.email ? contact.telephony.email.toString() : "",
                                    number: contact.telephony.number ? contact.telephony.number.toString() : "",
                                    imageURL: contact.person.imageURL ? contact.person.imageURL : "",
                                };
                                phonebook_state.push(contact_json);
                                if (!Array.isArray(contact.telephony.number)) {
                                    const nr = this.checkPhoneNumber(contact.telephony.number);
                                    contactname[nr] = name + bookname;
                                } else {
                                    for (const phone of contact.telephony.number) {
                                        const nrp = this.checkPhoneNumber(phone);
                                        contactname[nrp] = name + bookname;
                                    }
                                }
                            }
                        }
                    }
                    if (phonebook_state.length > 0 && this.config.phone) {
                        const common = {
                            name: {
                                en: "Phonebook %s",
                                de: "Telefonbuch %s",
                                ru: "Phonebook %s",
                                pt: "Livro de telefone %s",
                                nl: "Telefoonboek",
                                fr: "Annuaire téléphonique %s",
                                it: "Telefono %s",
                                es: "Phonebook %s",
                                pl: "Książka telefoniczna %s",
                                uk: "Контакти %s",
                                "zh-cn": "电话簿 %s",
                            },
                            type: "string",
                            role: "json",
                            desc: "Phonebook",
                            read: true,
                            write: false,
                            def: "[]",
                        };
                        const phoneName =
                            this.phonebook[attr] != null ? Buffer.from(this.phonebook[attr], "ascii").toString() : "";
                        common.name = JSON.parse(JSON.stringify(common.name).replace(/%s/g, phoneName));
                        await this.adapter.createDataPoint(
                            `${this.config.dp}.TR_064.Phonebooks.phonebook_${attr}`,
                            common,
                            "state",
                            JSON.stringify(phonebook_state),
                        );
                    }
                }
                // TODO Delete old phonebooks
            }
            let voip = await this.requests(
                "/upnp/control/x_voip",
                "urn:dslforum-org:service:X_VoIP:1",
                "X_AVM-DE_GetClients",
                "",
            );
            if (voip != null && typeof voip === "string" && voip.indexOf("NewX_AVM-DE_ClientList") != -1) {
                voip = entities.decodeHTML(voip.toString().replace(/\n/g, ""));
                const voips = voip.match("<NewX_AVM-DE_ClientList>(.*?)</NewX_AVM-DE_ClientList>");
                if (voips != null && voips[1] != null) {
                    await this.parser
                        .parseStringPromise(voips[1])
                        .then((result) => {
                            if (
                                result &&
                                result["newx_avm-de_clientlist"] &&
                                result["newx_avm-de_clientlist"].list &&
                                result["newx_avm-de_clientlist"].list.item &&
                                Array.isArray(result["newx_avm-de_clientlist"].list.item)
                            ) {
                                for (const client of result["newx_avm-de_clientlist"].list.item) {
                                    if (
                                        client &&
                                        client["x_avm-de_outgoingnumber"] != null &&
                                        client["x_avm-de_phonename"] != null
                                    ) {
                                        contactname[client["x_avm-de_outgoingnumber"]] = client["x_avm-de_phonename"];
                                        contactname[client["x_avm-de_internalnumber"]] = client["x_avm-de_phonename"];
                                    }
                                }
                            }
                        })
                        .catch((err) => {
                            this.adapter.log.warn(err);
                        });
                }
            }
            return contactname;
        }
    }

    getCountryCode(number) {
        return this.country["country"] + number.substr(1);
    }

    checkPhoneNumber(number) {
        if (number.startsWith("*")) return number;
        number = number.replace(/\+/g, "00");
        if (this.country["area"] != "" && !number.startsWith("0")) {
            number = this.country["area"] + number;
        }
        return typeof number === "string" ? number : number.toString();
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

module.exports = Calllist;
