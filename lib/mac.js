const EventEmitter = require("events");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const xml2js = require("xml2js");

/**
 *
 * @extends EventEmitter
 */
class MACMonitor extends EventEmitter {
    constructor(config, adapter) {
        super();
        this.adapter = adapter;
        this.config = config;
        this.checkinterval = null;
        this.baseURL = `${config.protocol}://${config.ip}:49000`;
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalizeTags: true,
            ignoreAttrs: true,
        });
        this.all_mac = [];
        this.checkvalue = {};
        this.checkmac = {};
    }

    async start() {
        const regexp = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/i;
        let first = true;
        if (this.config.mac && Array.isArray(this.config.mac)) {
            for (const mac of this.config.mac) {
                if (this.config.ip === mac.ip && mac.active && regexp.test(mac.mac)) {
                    if (!this.checkmac[mac.mac]) {
                        this.checkmac[mac.mac] = true;
                    } else {
                        this.adapter.log.warn(`Found double mac address ${mac.mac}`);
                        continue;
                    }
                    const mac_add = {
                        ip: mac.ip,
                        mac: mac.mac,
                        mac_object: mac.mac.toString().replace(/:/g, "_").toUpperCase(),
                        name: mac.mac_name,
                        online_time: 0,
                        offline_time: 0,
                        offline_time_temp: 0,
                        offline_minutes: 0,
                        active: mac.active,
                        interval: mac.off_time * 60 * 1000,
                        last_check: 0,
                        name_fritz: "",
                        ip_fritz: "",
                        interface_fritz: "",
                        source_fritz: "",
                        remaining_fritz: 0,
                        active_fritz: 0,
                    };
                    const mac_check = await this.requests(
                        "/upnp/control/hosts",
                        "urn:dslforum-org:service:Hosts:1",
                        "GetSpecificHostEntry",
                        "<NewMACAddress>" + mac.mac + "</NewMACAddress>",
                    );
                    if (mac_check != null && typeof mac_check === "string" && mac_check.indexOf("NewIPAddress") != -1) {
                        if (mac_check.indexOf("NewIPAddress") != -1) {
                            const address = mac_check.match("<NewIPAddress>(.*?)</NewIPAddress>");
                            if (address != null && address[1] != null) {
                                mac_add.ip_fritz = typeof address[1] === "string" ? address[1] : "";
                            }
                        }
                        if (mac_check.indexOf("NewAddressSource") != -1) {
                            const addsource = mac_check.match("<NewAddressSource>(.*?)</NewAddressSource>");
                            if (addsource != null && addsource[1] != null) {
                                mac_add.source_fritz = typeof addsource[1] === "string" ? addsource[1] : "";
                            }
                        }
                        if (mac_check.indexOf("NewLeaseTimeRemaining") != -1) {
                            const remaining = mac_check.match("<NewLeaseTimeRemaining>(.*?)</NewLeaseTimeRemaining>");
                            if (remaining != null && remaining[1] != null) {
                                mac_add.remaining_fritz = typeof remaining[1] === "string" ? parseInt(remaining[1]) : 0;
                            }
                        }
                        if (mac_check.indexOf("NewActive") != -1) {
                            const active_fritz = mac_check.match("<NewActive>(.*?)</NewActive>");
                            if (active_fritz != null && active_fritz[1] != null) {
                                mac_add.active_fritz =
                                    typeof active_fritz[1] === "string" ? parseInt(active_fritz[1]) : 0;
                                if (mac_add.active_fritz) {
                                    mac_add.online_time = Date.now();
                                } else {
                                    mac_add.offline_time = Date.now();
                                }
                            }
                        }
                        if (mac_check.indexOf("NewHostName") != -1) {
                            const name_fritz = mac_check.match("<NewHostName>(.*?)</NewHostName>");
                            if (name_fritz != null && name_fritz[1] != null) {
                                mac_add.name_fritz = typeof name_fritz[1] === "string" ? name_fritz[1] : "Unknown";
                            }
                        }
                        if (mac_check.indexOf("NewInterfaceType") != -1) {
                            const interface_fritz = mac_check.match("<NewInterfaceType>(.*?)</NewInterfaceType>");
                            if (interface_fritz != null && interface_fritz[1] != null) {
                                mac_add.interface_fritz =
                                    interface_fritz[1] != null ? interface_fritz[1].toString() : "";
                            }
                        }
                        if (mac_add.mac_object) {
                            if (first) {
                                first = false;
                                await this.adapter.createAbsenceFolder(this.config);
                            }
                            this.adapter.log.info(`Start monitoring - ${mac.mac}`);
                            await this.adapter.createAbsence(this.config, mac_add);
                            this.all_mac.push(mac_add);
                        }
                        this.setStates(mac_add);
                    } else {
                        this.adapter.log.warn(`Cannot found mac address ${mac.mac}`);
                    }
                }
            }
        }
        if (this.all_mac.length > 0) {
            this.startInterval();
            return true;
        }
        return false;
    }

    startInterval() {
        this.checkinterval && this.adapter.clearInterval(this.checkinterval);
        this.checkinterval = this.adapter.setInterval(
            async () => {
                this.chechStatus();
            },
            this.config.interval * 60 * 1000,
        );
    }

    async chechStatus() {
        let count = 0;
        for (const phone of this.all_mac) {
            const mac_check = await this.requests(
                "/upnp/control/hosts",
                "urn:dslforum-org:service:Hosts:1",
                "GetSpecificHostEntry",
                "<NewMACAddress>" + phone.mac + "</NewMACAddress>",
            );
            if (mac_check != null && typeof mac_check === "string" && mac_check.indexOf("NewIPAddress") != -1) {
                phone.last_check = Date.now();
                if (mac_check.indexOf("NewIPAddress") != -1) {
                    const address = mac_check.match("<NewIPAddress>(.*?)</NewIPAddress>");
                    if (address != null && address[1] != null && phone.ip_fritz != address) {
                        phone.ip_fritz = typeof address[1] === "string" ? address[1] : "";
                    }
                }
                if (mac_check.indexOf("NewAddressSource") != -1) {
                    const addsource = mac_check.match("<NewAddressSource>(.*?)</NewAddressSource>");
                    if (addsource != null && addsource[1] != null && phone.source_fritz != addsource) {
                        phone.source_fritz = typeof addsource[1] === "string" ? addsource[1] : "";
                    }
                }
                if (mac_check.indexOf("NewLeaseTimeRemaining") != -1) {
                    const remaining = mac_check.match("<NewLeaseTimeRemaining>(.*?)</NewLeaseTimeRemaining>");
                    if (remaining != null && remaining[1] != null && phone.remaining_fritz != remaining) {
                        phone.remaining_fritz = typeof remaining[1] === "string" ? parseInt(remaining[1]) : 0;
                    }
                }
                if (mac_check.indexOf("NewActive") != -1) {
                    const active_fritz = mac_check.match("<NewActive>(.*?)</NewActive>");
                    if (active_fritz != null && active_fritz[1] != null) {
                        if (phone.active_fritz == 1 && active_fritz[1] != phone.active_fritz) {
                            if (phone.offline_time === 0) {
                                if (phone.offline_time_temp === 0) {
                                    phone.offline_time_temp = Date.now();
                                    phone.offline_minutes = 1;
                                } else {
                                    const last_off = Date.now() - phone.offline_time_temp;
                                    if (phone.interval > last_off) {
                                        phone.offline_minutes = Math.ceil(last_off / 60 / 1000);
                                    } else {
                                        phone.offline_time = Date.now();
                                        phone.offline_time_temp = 0;
                                        phone.active_fritz == 0;
                                    }
                                }
                            } else {
                                phone.offline_time_temp = 0;
                            }
                        }
                        if (phone.active_fritz == 1 && phone.offline_minutes > 0) {
                            phone.offline_minutes = 0;
                        }
                        if (phone.active_fritz == 0 && active_fritz[1] != phone.active_fritz) {
                            phone.offline_minutes = 0;
                            phone.online_time = Date.now();
                            phone.active_fritz = 1;
                            phone.online_time = 1;
                        }
                        if (phone.active_fritz == 1 && active_fritz[1] == phone.active_fritz) {
                            ++count;
                            const last_on = Date.now() - phone.online_time;
                            phone.online_time = Math.ceil(last_on / 1000);
                        }
                        if (phone.active_fritz == 0 && active_fritz[1] == phone.active_fritz) {
                            if (phone.offline_time == 0) {
                                phone.offline_time = Date.now();
                                phone.offline_minutes = 1;
                            } else {
                                const last_off = Date.now() - phone.offline_time;
                                phone.offline_minutes = Math.ceil(last_off / 60 / 1000);
                            }
                        }
                    }
                }
                if (mac_check.indexOf("NewHostName") != -1) {
                    const name_fritz = mac_check.match("<NewHostName>(.*?)</NewHostName>");
                    if (name_fritz != null && name_fritz[1] != null && phone.name_fritz != name_fritz) {
                        phone.name_fritz = typeof name_fritz[1] === "string" ? name_fritz[1] : "Unknown";
                    }
                }
                if (mac_check.indexOf("NewInterfaceType") != -1) {
                    const interface_fritz = mac_check.match("<NewInterfaceType>(.*?)</NewInterfaceType>");
                    if (interface_fritz != null && interface_fritz[1] != null && phone.name_fritz != interface_fritz) {
                        phone.interface_fritz = interface_fritz[1] != null ? interface_fritz[1].toString() : "";
                    }
                }
            } else {
                let lastTime = phone.offline_time;
                lastTime = Date.now() - phone.offline_time;
                phone.offline_minutes = phone.offline_minutes + lastTime;
                phone.active_fritz = 0;
                phone.last_check = Date.now();
            }
        }
        const object_path = `${this.config.dp}.TR_064.Presence.status_all`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != count) {
            await this.adapter.setStateAsync(object_path, count, true);
        }
    }

    async setStates(val) {
        let object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.status`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.active_fritz)) {
            this.checkvalue[object_path] == JSON.stringify(val.active_fritz);
            await this.adapter.setStateAsync(object_path, val.active_fritz ? true : false, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.lastonline`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.online_time)) {
            this.checkvalue[object_path] == JSON.stringify(val.online_time);
            await this.adapter.setStateAsync(object_path, val.online_time, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.lastoffline`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.offline_time)) {
            this.checkvalue[object_path] == JSON.stringify(val.offline_time);
            await this.adapter.setStateAsync(object_path, val.offline_time, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.ip`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.ip)) {
            this.checkvalue[object_path] == JSON.stringify(val.ip);
            await this.adapter.setStateAsync(object_path, val.ip, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.mac`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.mac)) {
            this.checkvalue[object_path] == JSON.stringify(val.mac);
            await this.adapter.setStateAsync(object_path, val.mac, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.namefritz`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.name_fritz)) {
            this.checkvalue[object_path] == JSON.stringify(val.name_fritz);
            await this.adapter.setStateAsync(object_path, val.name_fritz, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.name`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.name)) {
            this.checkvalue[object_path] == JSON.stringify(val.name);
            await this.adapter.setStateAsync(object_path, val.name, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.currentoffline`;
        if (!this.checkvalue[object_path] || this.checkvalue[object_path] != JSON.stringify(val.offline_minutes)) {
            this.checkvalue[object_path] == JSON.stringify(val.offline_minutes);
            await this.adapter.setStateAsync(object_path, val.offline_minutes, true);
        }
        object_path = `${this.config.dp}.TR_064.Presence.${val.mac_object}.json`;
        if (!this.checkvalue[object_path] || JSON.stringify(this.checkvalue[object_path]) != JSON.stringify(val)) {
            this.checkvalue[object_path] = {};
            this.checkvalue[object_path] == val;
            await this.adapter.setStateAsync(object_path, JSON.stringify(val), true);
        }
    }

    destroy() {
        this.checkinterval && this.adapter.clearInterval(this.checkinterval);
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

module.exports = MACMonitor;
