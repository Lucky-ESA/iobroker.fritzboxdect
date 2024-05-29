/* eslint-disable no-var */
/* eslint-disable no-undef */
// @ts-nocheck
"use strict";

if (typeof goog !== "undefined") {
    goog.provide("Blockly.JavaScript.Sendto");
    goog.require("Blockly.JavaScript");
}

Blockly.Translate =
    Blockly.Translate ||
    function (word, lang) {
        lang = lang || systemLang;
        if (Blockly.Words && Blockly.Words[word]) {
            return Blockly.Words[word][lang] || Blockly.Words[word].en;
        } else {
            return word;
        }
    };

/// --- SendTo imap --------------------------------------------------
Blockly.Words["no_instance_found"] = {
    en: "No instance found",
    de: "Keine Instanz gefunden",
    ru: "Не найден",
    pt: "Nenhuma instância encontrada",
    nl: "Geen instantie gevonden",
    fr: "Aucune instance trouvée",
    it: "Nessun caso trovato",
    es: "No hay caso encontrado",
    pl: "Brak",
    uk: "Не знайдено",
    "zh-cn": "未找到实例",
};
Blockly.Words["tr064_log"] = {
    en: "Loglevel",
    de: "Loglevel",
    ru: "Войти",
    pt: "Nível de log",
    nl: "Loglevel",
    fr: "Loglevel",
    it: "Livello di registro",
    es: "Nivel de estudios",
    pl: "Logos",
    uk: "Увійти",
    "zh-cn": "后勤问题",
};
Blockly.Words["tr064_log_none"] = {
    en: "none",
    de: "kein",
    ru: "нет",
    pt: "nenhum",
    nl: "niemand",
    fr: "aucun",
    it: "nessuno",
    es: "ninguno",
    pl: "żaden",
    uk: "немає",
    "zh-cn": "无",
};
Blockly.Words["tr064_log_info"] = {
    en: "info",
    de: "info",
    ru: "инфо",
    pt: "info",
    nl: "info",
    fr: "info",
    it: "info",
    es: "info",
    pl: "info",
    uk: "контакти",
    "zh-cn": "导 言",
};
Blockly.Words["tr064_log_debug"] = {
    en: "debug",
    de: "debug",
    ru: "дебаг",
    pt: "depuração",
    nl: "debug",
    fr: "debug",
    it: "debug",
    es: "debug",
    pl: "debug",
    uk: "напляскване",
    "zh-cn": "黑暗",
};
Blockly.Words["tr064_log_warn"] = {
    en: "warn",
    de: "warnen",
    ru: "предупреждение",
    pt: "avisem",
    nl: "waarschuwing",
    fr: "prévenir",
    it: "avvertire avvertire",
    es: "warn",
    pl: "ostrzegać",
    uk: "про нас",
    "zh-cn": "战争",
};
Blockly.Words["tr064_log_error"] = {
    en: "error",
    de: "fehler",
    ru: "ошибка",
    pt: "erro",
    nl: "error",
    fr: "erreur",
    it: "errore",
    es: "error",
    pl: "błąd",
    uk: "про нас",
    "zh-cn": "错误",
};
Blockly.Words["tr064_tooltip"] = {
    en: "Send a TR-064 command",
    de: "Einen TR-064 Befehl senden",
    ru: "Отправить команду TR-064",
    pt: "Enviar um comando TR-064",
    nl: "Een TR-064 commando versturen",
    fr: "Envoyer une commande TR-064",
    it: "Invia un comando TR-064",
    es: "Enviar un comando TR-064",
    pl: "Wyślij polecenie TR- 064",
    uk: "Надіслати команду TR-064",
    "zh-cn": "发送 TR-064 命令",
};
Blockly.Words["tr064_help"] = {
    en: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    de: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    ru: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    pt: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    nl: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    fr: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    it: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    es: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    pl: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    uk: "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
    "zh-cn": "https://github.com/Lucky-ESA/ioBroker.fritzboxdect/blob/master/README.md",
};
Blockly.Words["tr064_select"] = {
    en: "Select the IP",
    de: "IP auswählen",
    ru: "Выберите IP",
    pt: "Selecione o IP",
    nl: "Selecteer het IP",
    fr: "Sélectionnez l'IP",
    it: "Selezionare l'IP",
    es: "Seleccione la IP",
    pl: "Wybierz IP",
    uk: "Виберіть IP",
    "zh-cn": "选择 IP",
};
Blockly.Words["tr064"] = {
    en: "Select the IP",
    de: "IP auswählen",
    ru: "Выберите IP",
    pt: "Selecione o IP",
    nl: "Selecteer het IP",
    fr: "Sélectionnez l'IP",
    it: "Selezionare l'IP",
    es: "Seleccione la IP",
    pl: "Wybierz IP",
    uk: "Виберіть IP",
    "zh-cn": "选择 IP",
};
Blockly.Words["tr064_ip"] = {
    en: "IP Fritzbox",
    de: "IP Fritzbox",
    ru: "IP Фрицбокс",
    pt: "IP Fritzbox",
    nl: "IP Fritzbox",
    fr: "IP Fritzbox",
    it: "Fritzbox IP",
    es: "IP Fritzbox",
    pl: "IP Fritzbox",
    uk: "ІП Фрицбокс",
    "zh-cn": "IP Fritz 选项",
};
Blockly.Words["tr064_service"] = {
    en: "Service ID",
    de: "Service-ID",
    ru: "Service-ID",
    pt: "ID de serviço",
    nl: "Service-ID",
    fr: "Numéro de service",
    it: "ID servizio",
    es: "ID de servicio",
    pl: "Identyfikator usługi",
    uk: "Довідка",
    "zh-cn": "服务标识",
};
Blockly.Words["tr064_action"] = {
    en: "Action",
    de: "Aktion",
    ru: "Действия",
    pt: "Acção",
    nl: "Actie",
    fr: "Décision",
    it: "Azione",
    es: "Medida",
    pl: "Działanie",
    uk: "Дія",
    "zh-cn": "行动",
};
Blockly.Words["tr064_param_1"] = {
    en: "Parameter 1",
    de: "Parameter 1",
    ru: "Параметр 1",
    pt: "Parâmetro 1",
    nl: "Parameter 1",
    fr: "Paramètres 1",
    it: "Parametro 1",
    es: "Parámetro 1",
    pl: "Parametr 1",
    uk: "Параметр 1",
    "zh-cn": "参数1",
};
Blockly.Words["tr064_val_1"] = {
    en: "Value 1",
    de: "Wert 1",
    ru: "Стоимость 1",
    pt: "Valor 1",
    nl: "Waarde 1",
    fr: "Valeur 1",
    it: "Valore 1",
    es: "Valor 1",
    pl: "Wartość 1",
    uk: "Ціна 1",
    "zh-cn": "价值1",
};
Blockly.Words["tr064_param_2"] = {
    en: "Parameter 2",
    de: "Parameter 2",
    ru: "Параметр 2",
    pt: "Parâmetro 2",
    nl: "Parameter 2",
    fr: "Paramètres 2",
    it: "Parametro 2",
    es: "Parámetro 2",
    pl: "Parametr 2",
    uk: "Параметр 2",
    "zh-cn": "参数2",
};
Blockly.Words["tr064_val_2"] = {
    en: "Value 2",
    de: "Wert 2",
    ru: "Значение 2",
    pt: "Valor 2",
    nl: "Waarde 2",
    fr: "Valeur 2",
    it: "Valore 2",
    es: "Valor 2",
    pl: "Wartość 2",
    uk: "Ціна 2",
    "zh-cn": "准则2",
};
Blockly.Words["tr064_link"] = {
    en: "Link",
    de: "Link",
    ru: "Ссылка",
    pt: "Link",
    nl: "Verband",
    fr: "Lien",
    it: "Link",
    es: "Enlace",
    pl: "Związek",
    uk: "Посилання",
    "zh-cn": "链接",
};
Blockly.Words["tr064_tag"] = {
    en: "HTML Tag",
    de: "HTML Tag",
    ru: "HTML Tag",
    pt: "HTML Tag Tag",
    nl: "HTML Tag",
    fr: "HTML Balise",
    it: "HTML Tag:",
    es: "HTML Tag",
    pl: "HTML Znacznik",
    uk: "Українська Навігація",
    "zh-cn": "HTML 语句 标记",
};
Blockly.Words["tr064_html"] = {
    en: "Convert html entities",
    de: "HTML umwandeln",
    ru: "Перевести html",
    pt: "Converter entidades HTML",
    nl: "Html-entiteiten omzetten",
    fr: "Convertir les entités html",
    it: "Convertire entità html",
    es: "Convertir html entities",
    pl: "Konwersja podmiotów html",
    uk: "Перетворення html-сутностей",
    "zh-cn": "转换 html 实体",
};
Blockly.Sendto.blocks["tr064"] =
    '<block type="tr064">' +
    '     <value name="INSTANCE">' +
    "     </value>" +
    '     <value name="IP">' +
    "     </value>" +
    '     <value name="SERVICE">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">SERVICE-ID</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="ACTION">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">Action</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="PARAM_1">' +
    '         <shadow type="text">' +
    '             <field name="TEXT"></field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="VAL_1">' +
    '         <shadow type="text">' +
    '             <field name="TEXT"></field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="PARAM_2">' +
    '         <shadow type="text">' +
    '             <field name="TEXT"></field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="VAL_2">' +
    '         <shadow type="text">' +
    '             <field name="TEXT"></field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="LINK">' +
    '         <shadow type="text">' +
    '             <field name="TEXT"></field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="TAG">' +
    '         <shadow type="text">' +
    '             <field name="TEXT"></field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="HTML">' +
    "     </value>" +
    '     <value name="LOG">' +
    "     </value>" +
    '     <value name="STATEMENT">' +
    "     </value>" +
    "</block>";

Blockly.Blocks["tr064"] = {
    init: function () {
        var options_user = [];
        var options_instance = [];
        options_user.push([Blockly.Translate("tr064_select"), "all"]);
        if (typeof main !== "undefined" && main.instances) {
            for (var i = 0; i < main.instances.length; i++) {
                var m = main.instances[i].match(/^system.adapter.fritzboxdect.(\d+)$/);
                if (m) {
                    var n = parseInt(m[1], 10);
                    options_instance.push(["fritzboxdect." + n, "." + n]);
                    if (main.objects[main.instances[i]].native.fritz) {
                        for (var a = 0; a < main.objects[main.instances[i]].native.fritz.length; a++) {
                            //Checking active in the main.js.
                            var id = main.objects[main.instances[i]].native.fritz[a].ip;
                            options_user.push([n + "." + id, id]);
                        }
                    }
                }
            }
        }
        if (Object.keys(options_instance).length == 0)
            options_instance.push([Blockly.Translate("no_instance_found"), ""]);

        this.appendDummyInput("INSTANCE")
            .appendField(Blockly.Translate("tr064"))
            .appendField(new Blockly.FieldDropdown(options_instance), "INSTANCE");
        this.appendDummyInput("IP")
            .appendField(Blockly.Translate("tr064_ip"))
            .appendField(new Blockly.FieldDropdown(options_user), "IP");
        this.appendValueInput("SERVICE").appendField(Blockly.Translate("tr064_service"));
        this.appendValueInput("ACTION").appendField(Blockly.Translate("tr064_action"));
        this.appendValueInput("PARAM_1").appendField(Blockly.Translate("tr064_param_1"));
        this.appendValueInput("VAL_1").appendField(Blockly.Translate("tr064_val_1"));
        this.appendValueInput("PARAM_2").appendField(Blockly.Translate("tr064_param_2"));
        this.appendValueInput("VAL_2").appendField(Blockly.Translate("tr064_val_2"));
        this.appendValueInput("LINK").appendField(Blockly.Translate("tr064_link"));
        this.appendValueInput("TAG").appendField(Blockly.Translate("tr064_tag"));
        this.appendDummyInput("HTML")
            .appendField(Blockly.Translate("tr064_html"))
            .appendField(new Blockly.FieldCheckbox("TRUE"), "HTML");
        this.appendDummyInput("LOG")
            .appendField(Blockly.Translate("tr064_log"))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate("tr064_log_none"), ""],
                    [Blockly.Translate("tr064_log_info"), "log"],
                    [Blockly.Translate("tr064_log_debug"), "debug"],
                    [Blockly.Translate("tr064_log_warn"), "warn"],
                    [Blockly.Translate("tr064_log_error"), "error"],
                ]),
                "LOG",
            );
        this.appendStatementInput("STATEMENT").setCheck(null);
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate("tr064_tooltip"));
        this.setHelpUrl(Blockly.Translate("tr064_help"));
    },
};

Blockly.JavaScript["tr064"] = function (block) {
    var dropdown_instance = block.getFieldValue("INSTANCE");
    var logLevel = block.getFieldValue("LOG");
    var value_ip = block.getFieldValue("IP");
    var value_service = Blockly.JavaScript.valueToCode(block, "SERVICE", Blockly.JavaScript.ORDER_ATOMIC);
    var value_action = Blockly.JavaScript.valueToCode(block, "ACTION", Blockly.JavaScript.ORDER_ATOMIC);
    var value_param_1 = Blockly.JavaScript.valueToCode(block, "PARAM_1", Blockly.JavaScript.ORDER_ATOMIC);
    var value_val_1 = Blockly.JavaScript.valueToCode(block, "VAL_1", Blockly.JavaScript.ORDER_ATOMIC);
    var value_param_2 = Blockly.JavaScript.valueToCode(block, "PARAM_2", Blockly.JavaScript.ORDER_ATOMIC);
    var value_val_2 = Blockly.JavaScript.valueToCode(block, "VAL_2", Blockly.JavaScript.ORDER_ATOMIC);
    var value_link = Blockly.JavaScript.valueToCode(block, "LINK", Blockly.JavaScript.ORDER_ATOMIC);
    var value_tag = Blockly.JavaScript.valueToCode(block, "TAG", Blockly.JavaScript.ORDER_ATOMIC);
    var value_html = block.getFieldValue("HTML");
    if (value_html === "TRUE" || value_html === "true" || value_html === true) {
        value_html = true;
    } else {
        value_html = false;
    }

    var text = "{\n";
    text += '  ip: "' + value_ip + '",\n';
    text += "   service: " + value_service + ",\n";
    text += "   action: " + value_action + ",\n";
    text += "   param_1: " + value_param_1 + ",\n";
    text += "   val_1: " + value_val_1 + ",\n";
    text += "   param_2: " + value_param_2 + ",\n";
    text += "   val_2: " + value_val_2 + ",\n";
    text += "   link: " + value_link + ",\n";
    text += "   tag: " + value_tag + ",\n";
    text += "   html: " + value_html + ",\n";
    text += "}";

    var logText;
    if (logLevel) {
        logText = "console." + logLevel + '("imap_request: ' + text + '");\n';
    } else {
        logText = "";
    }
    var statement;
    statement = Blockly.JavaScript.statementToCode(block, "STATEMENT");
    var command = "getTRRequest";
    return (
        'sendTo("fritzboxdect' +
        dropdown_instance +
        '", "' +
        command +
        '", ' +
        text +
        ", async function (result) {\n  " +
        statement +
        "  });\n" +
        logText
    );
};
