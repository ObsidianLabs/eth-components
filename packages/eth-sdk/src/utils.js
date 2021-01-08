const util = {
  sign: {
    sha3: () => ''
  },
  format: {
    bytes: () => ''
  },
  unit: {
    fromDripToCFX: () => '',
    fromCFXToDrip: () => '',
    fromDripToGDrip: () => '',
  }
}

export default {
  sign: {
    sha3: util.sign.sha3
  },
  format: {
    bytes: util.format.bytes
  },
  unit: {
    fromValue: util.unit.fromDripToCFX,
    toValue: util.unit.fromCFXToDrip,
    valueToGvalue: util.unit.fromDripToGDrip
  }
}