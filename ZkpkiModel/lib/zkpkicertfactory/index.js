﻿"use strict";

function validateCertificateOptions(options) {
    if (!Number.isInteger(options.serialNumber))
        throw new Error("serialNumber option is required and must be an integer");
    if (!Number.isInteger(options.lifetimeDays))
        throw new Error("lifetimeDays option is required and must be an integer");
    if (!options.issuerDn)
        throw new Error("issuerDn option is required");
    if (!options.subjectDn)
        throw new Error("subjectDn option is required");
    if (options.subjectAlterativeNames) {
        if (!Array.isArray(options.subjectAlternativeNames))
            throw new Error("subjectAlternativeNames option must be an array");
        options.subjectAlternativeNames.forEach(sAN => {
            if (!("ip" in sAN || "dns" in sAN)) {
                throw new Error(
                    "subjectAlternativeNames option is an array of objects with a single property, "
                    + "where that property is either 'ip' or 'dns'");
            }
        });
    }
}

function validateCertificateSigningRequest(csrPemData) {
    // TODO: write this
}


let ZkPkiCertFactory = function () {
    const certUtil = require("../cert-util");
    const rawCert = require("./rawcert.js");
    const ZkPkiCert = require("./zkpkicert.js");

    // constants
    const startingSerialNumber = 100000;

    // load zkpki certificate from PEM data or raw pkijs
    this.loadCertificate = async (data = {}) => {
        let zkpkiCert = new ZkPkiCert(data);

        // because some logic using pkijs below requires async functions
        // we have to put this logic here rather than in the ZkPkiCert constructor

        // certificate
        if (zkpkiCert.certificatePemData === null && zkpkiCert.certificate === null) {
            throw new Error("Unable to create ZkPkiCert with no certificate object and no PEM");
        } else if (zkpkiCert.certificatePemData === null && zkpkiCert.certificate !== null) {
            zkpkiCert.certificatePemData = certUtil.conversions.berToPem("CERTIFICATE",
                zkpkiCert.certificate.toSchema(true).toBER(false));
        } else if (zkpkiCert.certificatePemData !== null && zkpkiCert.certificate === null) {
            zkpkiCert.certificate = rawCert.parseRawCertificate(certUtil.conversions.pemToBer(zkpkiCert.certificatePemData));
        }

        // private key
        if (zkpkiCert.privateKeyPemData === null && zkpkiCert.privateKey !== null) {
            // TODO:
        } else if (zkpkiCert.privateKeyPemData !== null && zkpkiCert.privateKey === null) {
            // TODO:
        }
        return zkpkiCert;
    }

    // create zkpki root certificate authority
    this.createCertificateAuthority = async (distinguishedName, lifetimeDays, algorithm, keySizeOrCurveName) => {
        let keyPair = null;
        switch (algorithm) {
            case certUtil.ALGORITHMS.RsaSsaPkcs1V1_5:
            case certUtil.ALGORITHMS.RsaPss:
                keyPair = await rawCert.generateRsaKeyPair(algorithm || certUtil.ALGORITHMS.RsaSsaPkcs1V1_5,
                        keySizeOrCurveName || 2048);
                break;
            case certUtil.ALGORITHMS.Ecdsa:
                keyPair = await rawCert.generateEcdsaKeyPair(
                    keySizeOrCurveName || certUtil.ELLIPTIC_CURVE_NAMES.NistP256);
                break;
            default:
                throw new Error(`Unknown algorithm name: ${algorithm}`);
        }
        const zkpkiCert = await this.createCertificate(keyPair,
            keyPair.publicKey,
            {
                serialNumber: startingSerialNumber,
                issuerDn: distinguishedName,
                subjectDn: distinguishedName,
                lifetimeDays: lifetimeDays || (365 * 10),
                isCa: true,
                keyUsages: certUtil.KEY_USAGES.KeySignCert | certUtil.KEY_USAGES.CrlSign,
                extendedKeyUsages: [
                    certUtil.EXTENDED_KEY_USAGES.MsCertificateTrustListSigning,
                    certUtil.EXTENDED_KEY_USAGES.ServerAuthentication,
                    certUtil.EXTENDED_KEY_USAGES.ClientAuthentication,
                    certUtil.EXTENDED_KEY_USAGES.OcspSigning,
                    certUtil.EXTENDED_KEY_USAGES.TimeStamping
                ]
            });
        zkpkiCert.privateKeyPemData =
            certUtil.conversions.berToPem("PRIVATE KEY", await rawCert.exportPrivateKey(keyPair));
        return zkpkiCert;
    }

    // create zkpki certificate from options
    this.createCertificate = async (issuerKeyPair, subjectPublicKey, options = {}) => {
        validateCertificateOptions(options);
        return this.loadCertificate({
            certificate: await rawCert.createRawCertificate(issuerKeyPair, subjectPublicKey, options)
        });
    }

    // create zkpki certificate from CSR
    this.createCertificateFromCsr = async (issuerKeyPair, csrPemData) => {
        validateCertificateSigningRequest(csrPemData);

        // TODO: write this
    }
}

module.exports = new ZkPkiCertFactory();
