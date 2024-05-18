module.exports = {
    /**
     * @param {object} id
     * @param {object} devices
     * @param {object} com
     * @param {string} dp_name
     */
    async createChannels(id, devices, com, dp_name) {
        let common = {};
        let device_array = [];
        if (Object.keys(devices).length == 0) {
            return;
        } else if (Object.keys(devices).length == 1) {
            device_array.push(devices);
        } else {
            device_array = devices;
        }
        if (!this.dect_device[id.dp]) {
            this.dect_device[id.dp] = {};
        }
        for (const device of device_array) {
            if (device.functionbitmask != 1) {
                const icon = this.getIcon(device.functionbitmask, device.productname);
                if (device.functionbitmask != null) {
                    device.functionbitmask = `${device.functionbitmask} - ${this.getmask(device.functionbitmask)}`;
                }
                const ident = `${dp_name}_${device.identifier.replace(/\s/g, "").replace(/-1/g, "")}`;
                if (device.productname === "FRITZ!DECT 500") {
                    device.colorcontrol.hex = "#000000";
                }
                if (!this.dect_device[id.dp][device.productname]) {
                    this.dect_device[id.dp][device.productname] = [];
                }
                this.dect_device[id.dp][device.productname].push(device);
                for (const key in device) {
                    common = {
                        name: device.name,
                        desc: device.name,
                        icon: icon,
                    };
                    await this.createDataPoint(`${id.dp}.${ident}`, common, "channel", null);
                    if (dp_name === "TEMPLATE") {
                        await this.createDataPoint(
                            `${id.dp}.${ident}.metadata`,
                            com.commons["metadata"],
                            "folder",
                            null,
                        );
                        await this.createDataPoint(
                            `${id.dp}.${ident}.metadata.setMetadata`,
                            com.commons["setMetadata"],
                            "state",
                            false,
                        );
                        await this.createDataPoint(`${id.dp}.${ident}.metadata.icon`, com.commons["icon"], "state", -1);
                        await this.createDataPoint(
                            `${id.dp}.${ident}.metadata.type`,
                            com.commons["type"],
                            "state",
                            "no set",
                        );
                        await this.createDataPoint(
                            `${id.dp}.${ident}.apply`,
                            com.commons["apply_template"],
                            "state",
                            false,
                        );
                    }
                    if (typeof device[key] === "object") {
                        common = {
                            name: key,
                            desc: key,
                            icon: icon,
                        };
                        await this.createDataPoint(`${id.dp}.${ident}.${key}`, common, "folder", null);
                        if (!Array.isArray(device[key])) {
                            for (const subkey in device[key]) {
                                if (typeof device[key][subkey] === "object") {
                                    common = {
                                        name: subkey,
                                        desc: subkey,
                                        icon: icon,
                                    };
                                    await this.createDataPoint(
                                        `${id.dp}.${ident}.${key}.${subkey}`,
                                        common,
                                        "folder",
                                        null,
                                    );
                                    if (subkey === "device" && Array.isArray(device[key][subkey])) {
                                        for (const subsubkey in device[key][subkey]) {
                                            for (const dubkey in device[key][subkey][subsubkey]) {
                                                if (com && com.commons && com.commons[dubkey]) {
                                                    await this.createDataPoint(
                                                        `${id.dp}.${ident}.${key}.${subkey}.${dubkey}${subsubkey}`,
                                                        com.commons[dubkey],
                                                        "state",
                                                        device[key][subkey][subsubkey][dubkey],
                                                    );
                                                } else {
                                                    this.log.warn(
                                                        `DoubleKey ${dubkey} is unknown. Please create an issue!`,
                                                    );
                                                }
                                            }
                                        }
                                    } else {
                                        for (const subsubkey in device[key][subkey]) {
                                            if (com && com.commons && com.commons[subsubkey]) {
                                                await this.createDataPoint(
                                                    `${id.dp}.${ident}.${key}.${subkey}.${subsubkey}`,
                                                    com.commons[subsubkey],
                                                    "state",
                                                    device[key][subkey][subsubkey],
                                                );
                                            } else {
                                                this.log.warn(
                                                    `SubSubKey ${subsubkey} is unknown. Please create an issue!`,
                                                );
                                            }
                                        }
                                    }
                                } else {
                                    if (com && com.commons && com.commons[subkey]) {
                                        if (key == "alert" && subkey == "state") common = com.commons["alertstate"];
                                        else if (key == "simpleonoff" && subkey == "state")
                                            common = com.commons["simpleonoff"];
                                        else common = com.commons[subkey];
                                        if (subkey === "interfaces")
                                            device[key][subkey] = this.getinterfaces(device[key][subkey]);
                                        await this.createDataPoint(
                                            `${id.dp}.${ident}.${key}.${subkey}`,
                                            common,
                                            "state",
                                            device[key][subkey],
                                        );
                                    } else {
                                        this.log.warn(`subKeys ${subkey} is unknown. Please create an issue!`);
                                    }
                                }
                            }
                        } else {
                            if (
                                key === "devices" ||
                                key === "triggers" ||
                                key === "sub_templates" ||
                                key === "applymask"
                            ) {
                                if (com && com.commons && com.commons[key]) {
                                    common = com.commons[key];
                                    await this.createDataPoint(
                                        `${id.dp}.${ident}.${key}`,
                                        common,
                                        "state",
                                        JSON.stringify(device[key]),
                                    );
                                } else {
                                    this.log.warn(`Keys ${key} is unknown. Please create an issue!`);
                                }
                            } else {
                                for (const button of device[key]) {
                                    this.log.debug(JSON.stringify(button));
                                    const ident_button = button.identifier.replace(/\s/g, "");
                                    common = {
                                        name: button.name,
                                        desc: button.name,
                                        icon: icon,
                                    };
                                    await this.createDataPoint(
                                        `${id.dp}.${ident}.${key}.${ident_button}`,
                                        common,
                                        "folder",
                                        null,
                                    );
                                    for (const keys in button) {
                                        if (com && com.commons && com.commons[keys]) {
                                            common = com.commons[keys];
                                            await this.createDataPoint(
                                                `${id.dp}.${ident}.${key}.${ident_button}.${keys}`,
                                                common,
                                                "state",
                                                button[keys],
                                            );
                                        } else {
                                            this.log.warn(`Keys ${keys} is unknown. Please create an issue!`);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (com && com.commons && com.commons[key]) {
                            common = com.commons[key];
                            await this.createDataPoint(`${id.dp}.${ident}.${key}`, common, "state", device[key]);
                        } else {
                            this.log.warn(`LastKey ${key} is unknown. Please create an issue!`);
                        }
                    }
                }
                device.ident = ident;
            } else {
                if (dp_name === "TRIGGER") {
                    const icon = "/img/trigger.png";
                    const ident = `${dp_name}_${device.identifier.replace(/\s/g, "").replace(/-1/g, "")}`;
                    for (const key in device) {
                        common = {
                            name: device.name,
                            desc: device.name,
                            icon: icon,
                        };
                        await this.createDataPoint(`${id.dp}.${ident}`, common, "channel", null);
                        for (const subkey in device[key]) {
                            if (com && com.commons && com.commons[subkey]) {
                                common = com.commons[subkey];
                                await this.createDataPoint(
                                    `${id.dp}.${ident}.${key}.${subkey}`,
                                    common,
                                    "state",
                                    device[key][subkey],
                                );
                            } else {
                                this.log.warn(`Key ${subkey} is unknown. Please create an issue!`);
                            }
                        }
                    }
                    device.ident = ident;
                }
            }
        }
        if (this.dect_device[id.dp]["FRITZ!DECT 500"] && dp_name === "DECT") {
            if (this.dect_device[id.dp]["FRITZ!DECT 500"].length > 0) {
                this.createColorTemplate(id, this.dect_device[id.dp]["FRITZ!DECT 500"]);
            }
        }
    },
    /**
     * @param {object} id
     * @param {object} dect
     */
    async createColorTemplate(id, dect) {
        let common = {};
        common = {
            name: {
                en: "Add color template",
                de: "Farbvorlage hinzufügen",
                ru: "Добавить шаблон цвета",
                pt: "Adicionar modelo de cor",
                nl: "Kleursjabloon toevoegen",
                fr: "Ajouter un modèle de couleur",
                it: "Aggiungi il modello di colore",
                es: "Añadir plantilla de color",
                pl: "Dodaj szablon kolorów",
                uk: "Додати шаблон кольору",
                "zh-cn": "添加颜色模板",
            },
            desc: "Add color template",
            icon: "/img/color_palette.png",
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.addColorTemplate`, common, "folder", null);
        common = {
            name: {
                en: "Create color template",
                de: "Farbvorlage erstellen",
                ru: "Создать шаблон цвета",
                pt: "Criar modelo de cor",
                nl: "Kleursjabloon aanmaken",
                fr: "Créer un modèle de couleur",
                it: "Crea il modello di colore",
                es: "Crear plantilla de color",
                pl: "Utwórz szablon kolorów",
                uk: "Створення шаблону кольору",
                "zh-cn": "创建颜色模板",
            },
            type: "boolean",
            role: "button",
            desc: "Create color template",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(
            `${id.dp}.DECT_Control.addColorTemplate.createColorTemplates`,
            common,
            "state",
            false,
        );
        common = {
            name: {
                en: "Create temperature color template",
                de: "Temperatur-Farbvorlage erstellen",
                ru: "Создать шаблон цвета температуры",
                pt: "Criar modelo de cor de temperatura",
                nl: "Temperatuurkleursjabloon aanmaken",
                fr: "Créer un modèle de couleur de température",
                it: "Crea il modello di colore della temperatura",
                es: "Crear plantilla de color de temperatura",
                pl: "Tworzenie szablonu kolorów temperatury",
                uk: "Створення шаблону кольору температури",
                "zh-cn": "创建温度颜色模板",
            },
            type: "boolean",
            role: "button",
            desc: "Create temperature template",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(
            `${id.dp}.DECT_Control.addColorTemplate.createTemperatureTemplates`,
            common,
            "state",
            false,
        );
        common = {
            name: {
                en: "Name from Template",
                de: "Name der Vorlage",
                ru: "Имя из шаблона",
                pt: "Nome do modelo",
                nl: "Naam van sjabloon",
                fr: "Nom du modèle",
                it: "Nome da Template",
                es: "Nombre de la Plantilla",
                pl: "Nazwa z szablonu",
                uk: "Ім'я з шаблону",
                "zh-cn": "模板中的名称",
            },
            type: "string",
            role: "state",
            desc: "Name from Template",
            read: true,
            write: true,
            def: "",
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.addColorTemplate.name_template`, common, "state", "");
        common = {
            name: {
                en: "HUE (0-359)",
                de: "HUE (0-359)",
                ru: "HUE (0-359)",
                pt: "HUE (0-359)",
                nl: "HUE (0-359)",
                fr: "HUE (0-359)",
                it: "HUE (0-359)",
                es: "HUE (0-359)",
                pl: "HUE (0- 359)",
                uk: "HUE (0-359)",
                "zh-cn": "胡适(0-359)",
            },
            type: "number",
            role: "value",
            desc: "HUE (0-359)",
            read: true,
            write: true,
            def: 0,
            min: 0,
            max: 359,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.addColorTemplate.hue_template`, common, "state", 0);
        common = {
            name: {
                en: "Saturation (0-255)",
                de: "Sättigung (0-255)",
                ru: "Saturation (0-255)",
                pt: "Saturação (0-255)",
                nl: "Verzadiging (0-255)",
                fr: "Saturation (0-255)",
                it: "Saturazione (0-255)",
                es: "Saturación (0-255)",
                pl: "Nasycenie (0- 255)",
                uk: "Закінчення (0-255)",
                "zh-cn": "饱和度( 0 - 255)",
            },
            type: "number",
            role: "value",
            desc: "Saturation (0-255)",
            read: true,
            write: true,
            def: 0,
            min: 0,
            max: 255,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.addColorTemplate.saturation_template`, common, "state", 0);
        common = {
            name: {
                en: "Level percentage (0-100)",
                de: "Niveauprozent (0-100)",
                ru: "Процентная доля (0-100)",
                pt: "Percentagem de nível (0-100)",
                nl: "Niveaupercentage (0-100)",
                fr: "Niveau (0-100)",
                it: "Percentuale di livello (0-100)",
                es: "Porcentaje de nivel (0 a 100)",
                pl: "Udział procentowy (0- 100)",
                uk: "Відсоток рівня (0-100)",
                "zh-cn": "职等百分比(0-100)",
            },
            type: "number",
            role: "level",
            desc: "Level percentage (0-100)",
            read: true,
            write: true,
            def: 0,
            min: 0,
            max: 100,
            unit: "%",
        };
        await this.createDataPoint(
            `${id.dp}.DECT_Control.addColorTemplate.levelPercentage_template`,
            common,
            "state",
            0,
        );
        common = {
            name: {
                en: "Temperature",
                de: "Temperatur",
                ru: "Температура",
                pt: "Temperatura",
                nl: "Temperatuur",
                fr: "Température",
                it: "Temperatura",
                es: "Temperatura",
                pl: "Temperatura",
                uk: "Погода",
                "zh-cn": "模范",
            },
            type: "number",
            role: "level.color.temperature",
            write: true,
            read: true,
            def: -1,
            min: -1,
            max: 6500,
            unit: "K",
            states: {
                0: "Keine Licht",
                2700: "Warmweiß_1",
                3000: "Warmweiß_2",
                3400: "Warmweiß_3",
                3800: "Neutral_1",
                4200: "Neutral_2",
                4700: "Neutral_3",
                5300: "Tageslicht_1",
                5900: "Tageslicht_1",
                6500: "Tageslicht_1",
            },
        };
        await this.createDataPoint(
            `${id.dp}.DECT_Control.addColorTemplate.colorTemperature_template`,
            common,
            "state",
            0,
        );
        common = {
            name: {
                en: "Use defaults colors",
                de: "Standardfarben verwenden",
                ru: "Использовать цвета по умолчанию",
                pt: "Use cores padrão",
                nl: "Standaardkleuren gebruiken",
                fr: "Utiliser les couleurs par défaut",
                it: "Utilizzare i colori di default",
                es: "Usar colores predeterminados",
                pl: "Użyj domyślnych kolorów",
                uk: "Використання кольорів за замовчуванням",
                "zh-cn": "使用默认颜色",
            },
            type: "boolean",
            role: "switch",
            write: true,
            read: true,
            def: false,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.addColorTemplate.colorpreset`, common, "state", false);
        for (const dev of dect) {
            const ident = `DECT_${dev.identifier.replace(/\s/g, "").replace(/-1/g, "")}`;
            common = {
                name: dev.name,
                type: "boolean",
                role: "switch",
                desc: "device",
                write: true,
                read: true,
                def: false,
            };
            await this.createDataPoint(`${id.dp}.DECT_Control.addColorTemplate.${ident}`, common, "state", false);
        }
        const all_dev = dect.length + 8;
        const all_state = await this.getObjectViewAsync("system", "state", {
            startkey: `${this.namespace}.${id.dp}.DECT_Control.addColorTemplate.`,
            endkey: `${this.namespace}.${id.dp}.DECT_Control.addColorTemplate.\u9999`,
        });
        if (all_state.rows.length > all_dev) {
            for (const dev of all_state.rows) {
                if (dev.value && dev.value.common && dev.value.common.desc === "device") {
                    const element = dev.id.pop();
                    const find_dp = dect.filter((item) => item.ident === element);
                    this.log.info(`Detele state ${dev.id}`);
                    if (!find_dp) {
                        await this.delObjectAsync(dev.id, {
                            recursive: true,
                        });
                    }
                }
            }
        }
    },
    /**
     * @param {object} id
     * @param {object} login
     */
    async createDevice(id, login) {
        let common = {};
        let icons;
        if (id.picture != null && id.picture != "") {
            icons = { icon: id.picture };
        }
        common = {
            name: id.name,
            desc: id.name,
            statusStates: {
                onlineId: `${this.namespace}.${id.dp}.DECT_Control.online`,
            },
            ...icons,
        };
        await this.createDataPoint(id.dp, common, "device", null);
        common = {
            name: {
                en: "Status",
                de: "Status",
                ru: "Статус",
                pt: "Estado",
                nl: "Status",
                fr: "État",
                it: "Stato",
                es: "Situación",
                pl: "Status",
                uk: "Статус на сервери",
                "zh-cn": "现状",
            },
            desc: "Create by Adapter",
            icon: "img/status.png",
        };
        await this.createDataPoint(`${id.dp}.DECT_Control`, common, "folder", null);
        common = {
            name: {
                en: "Own request",
                de: "Eigene Anfrage",
                ru: "Собственный запрос",
                pt: "Pedido próprio",
                nl: "Eigen verzoek",
                fr: "Demande propre",
                it: "Richiesta",
                es: "Solicitud propia",
                pl: "Wniosek własny",
                uk: "Власне замовлення",
                "zh-cn": "自行请求",
            },
            type: "string",
            role: "state",
            desc: "Own request",
            read: true,
            write: true,
            def: "",
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.own_request`, common, "state", "");
        common = {
            name: {
                en: "Response own request",
                de: "Antwort auf eigene Anfrage",
                ru: "Ответный запрос",
                pt: "Pedido próprio de resposta",
                nl: "Antwoord op eigen verzoek",
                fr: "Réponse propre demande",
                it: "Risposta richiesta",
                es: "Solicitud propia",
                pl: "Wniosek o udzielenie odpowiedzi",
                uk: "Відповідь на власний запит",
                "zh-cn": "自行答复请求",
            },
            type: "string",
            role: "json",
            desc: "Response own request",
            read: true,
            write: false,
            def: "{}",
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.own_request_response`, common, "state", "");
        common = {
            type: "boolean",
            role: "info.status",
            name: {
                en: "Status Fritzbox",
                de: "Status Fritzbox",
                ru: "Статус Fritzbox",
                pt: "Status Fritzbox",
                nl: "Status Fritzbox",
                fr: "Statut Fritzbox",
                it: "Stato Fritzbox",
                es: "Estado Fritzbox",
                pl: "Status Fritzbox",
                uk: "Статус Фрицбокс",
                "zh-cn": "弗朗西斯·弗里克地位",
            },
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: false,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.online`, common, "state", true);
        common = {
            type: "string",
            role: "state",
            name: {
                en: "Current SID",
                de: "Aktuelle SID",
                ru: "Текущий SID",
                pt: "SID atual",
                nl: "Current SID",
                fr: "SID actuel",
                it: "SID corrente",
                es: "SID actual",
                pl: "Aktualny SID",
                uk: "Поточний SID",
                "zh-cn": "目前",
            },
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.sid`, common, "state", login.SessionInfo.SID);
        common = {
            name: {
                en: "Start DECT-ULE paring",
                de: "DECT-ULE paring starten",
                ru: "Начните DECT-ULE paring",
                pt: "Comece a analisar DECT-ULE",
                nl: "Begin met DECT-ULE paring",
                fr: "Commencer le parage DECT-ULE",
                it: "Iniziare la parata DECT-ULE",
                es: "Comience a cortar DECT-ULE",
                pl: "Początek DECT-ULE",
                uk: "Старт DECT-ULE парування",
                "zh-cn": "A. 导 言",
            },
            type: "boolean",
            role: "button",
            write: true,
            read: true,
            def: false,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.startulesubscription`, common, "state", false);
        common = {
            name: {
                en: "DECT-ULE device registration status",
                de: "DECT-ULE Geräteregistrierungsstatus",
                ru: "Статус регистрации устройства DECT-ULE",
                pt: "Status de registro de dispositivo DECT-ULE",
                nl: "DECT-ULE apparaat registratie status",
                fr: "État d ' enregistrement des dispositifs DECT-ULE",
                it: "Stato di registrazione del dispositivo DECT-ULE",
                es: "Estado de registro del dispositivo DECT-ULE",
                pl: "Status rejestracyjny DECT-ULE",
                uk: "Статус на сервери",
                "zh-cn": "DECT-ULE设备登记状况",
            },
            type: "number",
            role: "info",
            write: false,
            read: true,
            def: 0,
            states: {
                0: "Anmeldung läuft nicht",
                1: "Anmeldung läuft",
                2: "timeout",
                3: "sonstiger Error Unterknoten",
            },
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.subscriptionstate`, common, "state", 0);
        common = {
            name: {
                en: "latest AIN",
                de: "neues von AIN",
                ru: "последняя",
                pt: "mais recente AIN",
                nl: "laatste AIN",
                fr: "dernier AIN",
                it: "aIN",
                es: "última AIN",
                pl: "aIN",
                uk: "останні новини",
                "zh-cn": "最新信息",
            },
            type: "number",
            role: "info",
            write: false,
            read: true,
            def: 0,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.subscriptionslatest`, common, "state", 0);
        common = {
            name: {
                en: "Reload DECT-ULE device registration status",
                de: "DECT-ULE Geräteregistrierungsstatus neu laden",
                ru: "Reload DECT-ULE статус регистрации устройства",
                pt: "Recarregar o status de registro do dispositivo DECT-ULE",
                nl: "Herladen DECTULE apparaat registratie status",
                fr: "Reload DECT-ULE device registration status",
                it: "Ricarica lo stato di registrazione del dispositivo DECT-ULE",
                es: "Cargue el estado de registro del dispositivo DECT-ULE",
                pl: "Status rejestracyjny DECT-ULE",
                uk: "Статус на сервери",
                "zh-cn": "D. 重载车辆登记状况",
            },
            type: "boolean",
            role: "button",
            write: true,
            read: true,
            def: false,
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.getsubscriptionstate`, common, "state", false);
        common = {
            type: "number",
            role: "value.time",
            name: {
                en: "Create SID",
                de: "SID erstellen",
                ru: "Создать SID",
                pt: "Criar SID",
                nl: "Creatie SID",
                fr: "Créer SID",
                it: "Creare SID",
                es: "Crear SID",
                pl: "Create SID",
                uk: "Створити SID",
                "zh-cn": "D. 创建国际发展中心",
            },
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: Date.now(),
        };
        await this.createDataPoint(`${id.dp}.DECT_Control.sid_create`, common, "state", Date.now());
    },
    /**
     * @param {string} ident
     * @param {object} common
     * @param {string} types
     * @param {string|number|boolean|null|undefined} types
     * @param {object|null|undefined} [native=null]
     */
    async createDataPoint(ident, common, types, value, native) {
        const nativvalue = !native ? { native: {} } : { native: native };
        const obj = await this.getObjectAsync(ident);
        if (!obj) {
            await this.setObjectNotExistsAsync(ident, {
                type: types,
                common: common,
                ...nativvalue,
            }).catch((error) => {
                this.log.warn(`createDataPoint: ${error}`);
            });
        } else {
            let ischange = false;
            if (obj.common && Object.keys(obj.common).length == Object.keys(common).length) {
                for (const key in common) {
                    if (obj.common[key] == null) {
                        ischange = true;
                        break;
                    } else if (JSON.stringify(obj.common[key]) != JSON.stringify(common[key])) {
                        ischange = true;
                        break;
                    }
                }
            } else {
                ischange = true;
            }
            if (JSON.stringify(obj.type) != JSON.stringify(types)) {
                ischange = true;
            }
            if (native) {
                if (Object.keys(obj.native).length == Object.keys(nativvalue.native).length) {
                    for (const key in obj.native) {
                        if (nativvalue.native[key] == null) {
                            ischange = true;
                            delete obj["native"];
                            obj["native"] = native;
                            break;
                        } else if (JSON.stringify(obj.native[key]) != JSON.stringify(nativvalue.native[key])) {
                            ischange = true;
                            obj.native[key] = nativvalue.native[key];
                            break;
                        }
                    }
                } else {
                    ischange = true;
                }
            }
            if (ischange) {
                this.log.debug(`INFORMATION - Change common: ${this.namespace}.${ident}`);
                delete obj["common"];
                obj["common"] = common;
                obj["type"] = types;
                await this.setObjectAsync(ident, obj);
            }
        }
        if (value != null) {
            await this.setStateAsync(ident, value, true);
        }
    },
};
