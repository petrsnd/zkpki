"use strict";

const pkijs = require("pkijs");
const asn1js = require("asn1js");
const constants = require("./constants.js");

function getOidForDnAttribute(attr) {
    switch (attr.toUpperCase()) {
        // RFC 5280 (4.1.2.4) attributes listed as MUST support:
        // * country,
        case "C":
            return "2.5.4.6";
        // * organization,
        case "O":
            return "2.5.4.10";
        // * organizational unit,
        case "OU":
            return "2.5.4.11";
        // * distinguished name qualifier,
        case "DNQUALIFIER":
            return "2.5.4.46";
        // * state or province name,
        case "ST":
        case "S":
            return "2.5.4.8";
        // * common name(e.g., "Dan Peterson"), and
        case "CN":
            return "2.5.4.3";
        // * serial number.
// ReSharper disable once StringLiteralTypo
        case "SERIALNUMBER":
            return "2.5.4.5";

        // RFC 5280 (4.1.2.4) attributes listed as SHOULD support:
        // * locality,
        case "L":
            return "2.5.4.7";
        // * title,
        case "T":
        case "TITLE":
            return "2.5.4.12";
        // * surname,
        case "SN":
            return "2.5.4.4";
        // * given name,
        case "G":
            return "2.5.4.42";
        // * initials,
        case "I":
            return "2.5.4.43";
        // * pseudonym, and
        case "2.5.4.65":
            return "2.5.4.65";
        //  * generation qualifier(e.g., "Jr.", "3rd", or "IV").
        case "2.5.4.44":
            return "2.5.4.44";

        // Also...
        // * domain component
        case "DC":
            return "0.9.2342.19200300.100.1.25";
        // * email address
        case "E":
            return "1.2.840.113549.1.9.1";
        // * rfc822Mailbox
        case "MAIL":
            return "0.9.2342.19200300.100.1.3";
        // * user ID
        case "UID":
            return "0.9.2342.19200300.100.1.1";
// ReSharper disable once StringLiteralTypo
        case "UNSTRUCTUREDNAME":
            return "1.2.840.113549.1.9.2";
// ReSharper disable once StringLiteralTypo
        case "UNSTRUCTUREDADDRESS":
            return "1.2.840.113549.1.9.8";
        default:
            throw new Error(`Unknown DN attribute ${attr}`);
    }
}

function getDnAttributeForOid(oid) {
    switch (oid) {
        // RFC 5280 (4.1.2.4) attributes listed as MUST support:
        // * country,
        case "2.5.4.6":
            return "C";
        // * organization,
        case "2.5.4.10":
            return "O";
        // * organizational unit,
        case "2.5.4.11":
            return "OU";
        // * distinguished name qualifier,
        case "2.5.4.46":
            return "DNQUALIFIER";
        // * state or province name,
        case "2.5.4.8":
            return "S";
        // * common name(e.g., "Dan Peterson"), and
        case "2.5.4.3":
            return "CN";
        // * serial number.
        // ReSharper disable once StringLiteralTypo
        case "2.5.4.5":
            return "SERIALNUMBER";

        // RFC 5280 (4.1.2.4) attributes listed as SHOULD support:
        // * locality,
        case "2.5.4.7":
            return "L";
        // * title,
        case "2.5.4.12":
            return "T";
        // * surname,
        case "2.5.4.4":
            return "SN";
        // * given name,
        case "2.5.4.42":
            return "G";
        // * initials,
        case "2.5.4.43":
            return "I";
        // * pseudonym, and
        case "2.5.4.65":
            return "2.5.4.65";
        //  * generation qualifier(e.g., "Jr.", "3rd", or "IV").
        case "2.5.4.44":
            return "2.5.4.44";

        // Also...
        // * domain component
        case "0.9.2342.19200300.100.1.25":
            return "DC";
        // * email address
        case "1.2.840.113549.1.9.1":
            return "E";
        // * rfc822Mailbox
        case "0.9.2342.19200300.100.1.3":
            return "MAIL";
        // * user ID
        case "0.9.2342.19200300.100.1.1":
            return "UID";
        // ReSharper disable once StringLiteralTypo
        case "1.2.840.113549.1.9.2":
            return "UNSTRUCTUREDNAME";
        // ReSharper disable once StringLiteralTypo
        case "1.2.840.113549.1.9.8":
            return "UNSTRUCTUREDADDRESS";
        default:
            throw new Error(`Unknown DN attribute OID ${oid}`);
    }
}

function getExtendedKeyUsageNameForOid(oid) {
    switch (oid) {
        case constants.ServerAuthentication:
            return "ServerAuthentication";
        case constants.ClientAuthentication:
            return "ClientAuthentication";
        case constants.CodeSigning:
            return "CodeSigning";
        case constants.EmailProtection:
            return "EmailProtection";
        case constants.TimeStamping:
            return "TimeStamping";
        case constants.OcspSigning:
            return "OcspSigning";
        case constants.MsCertificateTrustListSigning:
            return "MsCertificateTrustListSigning";
        case constants.MsEncryptedFileSystem:
            return "MsEncryptedFileSystem";
        default:
            return oid;
    }
}

exports.beautifyDnString = (dnString) => {
    let prettyDn = "";    
    dnString.match(/(?:\\,|[^,])+/g).forEach(function (dnPart) {
        const [attr, value] = dnPart.split("=");
        if (!attr || !value)
            throw new Error(`distinguishedName ${dnPart} did not parse`);
        prettyDn = prettyDn.concat(`${attr.toUpperCase().trim()}=${value.trim()},`);
    });
    return prettyDn.slice(0, -1);
}

exports.dnStringToDnTypesAndValues = (dnString) => {
    const dnTypesAndValues = [];
    dnString.match(/(?:\\,|[^,])+/g).reverse().forEach(function(dnPart) {
        const [attr, value] = dnPart.split("=");
        if (!attr || !value)
            throw new Error(`distinguishedName ${dnPart} did not parse`);
        dnTypesAndValues.push(new pkijs.AttributeTypeAndValue({
            type: getOidForDnAttribute(attr),
            value: new asn1js.PrintableString({ value: value })
        }));
    });
    if (dnTypesAndValues.length === 0) {
        throw new Error(`Unable to parse distinguished name from ${dnString}`);
    }
    return dnTypesAndValues;
}

exports.dnTypesAndValuesToDnString = (dnTypesAndValues) => {
    let dnString = "";
    dnTypesAndValues.reverse().forEach(function (dnAttrAndValue) {
        let dnAttr = getDnAttributeForOid(dnAttrAndValue.type);
        let dnValue = dnAttrAndValue.value.valueBlock.value;
        dnString = dnString.concat(`${dnAttr}=${dnValue},`);
    });
    return dnString.slice(0, -1);
}

exports.getCertificateDateRange = (numDays) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expire = new Date(today.valueOf());    
    expire.setDate(expire.getDate() + numDays);
    return [today, expire];
}

exports.keyUsagesAsArrayOfStrings = (extensions) => {
    // TODO: include tests too
    const stringArray = [];
    extensions.forEach(ext => {
        if (ext.extnID === "2.5.29.15") {

        }
    });
    return stringArray;
}

exports.extendedKeyUsagesAsArrayOfStrings = (extensions) => {
    const stringArray = [];
    extensions.forEach(ext => {
        if (ext.extnID === "2.5.29.37") {
            ext.parsedValue.keyPurposes.forEach(purpose => {
                stringArray.push(getExtendedKeyUsageNameForOid(purpose));
            });
        }
    });
    return stringArray;
}

exports.algorithmOidToAlgorithmName = (algorithmOid) => {
    if (!algorithmOid)
        throw new Error("Algorithm OID is required to find algorithm name");
    switch (algorithmOid) {
        case "1.2.840.113549.1.1.1":  // RSA encryption for PKCS#1
        case "1.2.840.113549.1.1.11": // RSA encryption with SHA256 and PKCS#1
            return constants.ALGORITHMS.RsaSsaPkcs1V1_5;
        case "1.2.840.113549.1.1.10":
            return constants.ALGORITHMS.RsaPss;
        case "1.2.840.10045.2.1":
            return constants.ALGORITHMS.Ecdsa;
        default:
            throw new Error(`Unknown algorithm OID ${algorithmOid}`);
    }
}

exports.curveOidToCurveName = (curveOid) => {
    if (!curveOid)
        throw new Error("Elliptic curve OID is required to find elliptic curve name");
    switch (curveOid) {
        case "1.2.840.10045.3.1.7":
            return constants.ELLIPTIC_CURVE_NAMES.NistP256;
        case "1.3.132.0.34":
            return constants.ELLIPTIC_CURVE_NAMES.NistP384;
        case "1.3.132.0.35":
            return constants.ELLIPTIC_CURVE_NAMES.NistP521;
        default:
            throw new Error(`Unknown elliptic curve OID ${curveOid}`);
    }
}

exports.berToPem = (label, berArray) => {
    if (!label || !berArray)
        throw new Error("Both the label and the BER array are required to generate PEM.");
    const buff = Buffer.from(berArray, "binary");
    const b64String = buff.toString("base64");
    const stringLength = b64String.length;
    let resultString = `-----BEGIN ${label.toUpperCase()}-----\r\n`;
    for (let i = 0, count = 0; i < stringLength; i++ , count++) {
        if (count > 63) {
            resultString = `${resultString}\r\n`;
            count = 0;
        }
        resultString = `${resultString}${b64String[i]}`;
    }
    return resultString + `\r\n-----END ${label.toUpperCase()}-----`;
}

exports.pemToBer = (pemData) => {
    const pemDataNoLabel = pemData.replace(/-----.*?-----/g, "");
    const b64String = pemDataNoLabel.replace(/\r|\n/g, "");
    const buff = Buffer.from(b64String, "base64");
    return new Uint8Array([...buff]).buffer;
}
