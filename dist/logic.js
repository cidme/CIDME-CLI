'use strict'

/* ************************************************************************** */
// Init AJV JSON Validator

let Ajv = require('ajv')
// let ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
// ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
let ajv = new Ajv({ schemaId: 'auto' })
/* ************************************************************************** */

/* ************************************************************************** */
// Init UUID.js

const UUID = require('uuidjs')
/* ************************************************************************** */

/* ************************************************************************** */
// Init CIDME core

let Cidme = require('cidme')
let cidme = new Cidme(ajv, UUID, false)
/* ************************************************************************** */

const createEntityAndEntityContext = (entityContextsNum, createMetadata, creatorId) => {
  let newOptions = []
  newOptions.createMetadata = createMetadata
  newOptions.creatorId = creatorId

  let data = cidme.createEntityResource(newOptions)
  // console.log('|' + data + '|');

  if (isNaN(entityContextsNum)) { entityContextsNum = 1 }

  for (let i = 0; i < entityContextsNum; i++) {
    data = cidme.addEntityContextToResource(data, cidme.createEntityContextResource(data['@id'], newOptions))
  }

  return data
}

const createResource = (resourceType, parentId, cidmeResourceJSON, createMetadata, creatorId) => {
  if (!resourceType) {
    console.log('ERROR: Resource type to create must be specified.')
    return false
  }

  let newOptions = []
  newOptions.createMetadata = createMetadata
  newOptions.creatorId = creatorId

  let data = false
  if (resourceType === 'Entity') {
    data = cidme.createEntityResource(newOptions)
  } else if (resourceType === 'MetadataGroup') {
    data = cidme.createMetadataGroupResource(parentId)
  } else if (resourceType === 'EntityContext') {
    data = cidme.createEntityContextResource(parentId, newOptions)
  } else if (resourceType === 'EntityContextLinkGroup') {
    data = cidme.createEntityContextLinkGroupResource(parentId, newOptions)
  } else if (resourceType === 'EntityContextDataGroup') {
    data = cidme.createEntityContextDataGroupResource(parentId, newOptions)
  } else {
    console.log('ERROR: Incorrect Resource type specified.')
    return false
  }

  if (!cidmeResourceJSON) {
    return data
  } else {
    try {
      var cidmeResource = JSON.parse(cidmeResourceJSON)
    } catch (err) {
      console.log('The provided CIDME resource JSON string is not valid.')
      return false
    }

    return cidme.addResourceToParent(parentId, cidmeResource, data)
  }
}

const viewResource = (data, level, options) => {
  // console.log(data);

  if (!level || isNaN(level)) { level = 1 }

  let noMetadata = false
  if (!options) {} else {
    if (!options.noMetadata) {} else { noMetadata = true }
  }

  try {
    var cidmeResource = JSON.parse(data)
  } catch (err) {
    console.log('The provided CIDME resource JSON string is not valid.')
    return false
  }

  let dashChar = ''

  if (!cidme.validate(cidmeResource)) {
    console.log('The provided CIDME resource JSON string is not valid.')
    return false
  }

  if (cidmeResource['@type'] === 'Entity') {
    console.log(' '.repeat(level - 1) + '-------------------------------')
    dashChar = ''
  } else {
    dashChar = '- '
  }

  if (cidmeResource['@type'] === 'EntityContext') {
    console.log('')
  }

  let extraInfo = ''
  let doNotShowMetadata = false

  // If this is a metadata resource, see if it has a @type in the data
  if (cidmeResource['@type'] === 'MetadataGroup') {
    if (cidmeResource.hasOwnProperty('data') && cidmeResource['data'].length > 0) {
      for (let i = 0; i < cidmeResource['data'].length; i++) {
        if (cidmeResource['data'][i].hasOwnProperty('@type')) {
          extraInfo += 'TYPE: ' + cidmeResource['data'][i]['@type'] + ' '

          if (cidmeResource['data'][i]['@type'] === 'CreatedMetadata') {
            doNotShowMetadata = true
          }
        }
      }
    }
  }

  // Show Resource info
  if (
    cidmeResource['@type'] !== 'MetadataGroup' ||
        (
          cidmeResource['@type'] === 'MetadataGroup' &&
            (
              !doNotShowMetadata ||
                !noMetadata
            )
        )
  ) {
    console.log('  '.repeat(level - 1) + dashChar + cidmeResource['@type'] + ': ' + extraInfo + '(' + cidmeResource['@id'] + ')')
  }

  // Show metadata data
  if (
    cidmeResource['@type'] === 'MetadataGroup' &&
        (
          !doNotShowMetadata ||
            !noMetadata
        )
  ) {
    for (let i = 0; i < cidmeResource['data'].length; i++) {
      for (var property in cidmeResource['data'][i]) {
        if (cidmeResource['data'][i].hasOwnProperty(property)) {
          if (property.substring(0, 1) !== '@') {
            console.log('  '.repeat(level) + property + ': ' + cidmeResource['data'][i][property])
          }
        }
      }
    }
  }

  if (cidmeResource['@type'] === 'Entity') {
    console.log('')
  }

  if (cidmeResource.hasOwnProperty('metadata') && cidmeResource['metadata'].length > 0) {
    for (let i = 0; i < cidmeResource['metadata'].length; i++) {
      viewResource(JSON.stringify(cidmeResource['metadata'][i]), (level + 1), options)
    }
  }

  if (cidmeResource.hasOwnProperty('entityContexts') && cidmeResource['entityContexts'].length > 0) {
    console.log('')
    console.log(' '.repeat(level - 1) + 'CONTEXTS:')

    for (let i = 0; i < cidmeResource['entityContexts'].length; i++) {
      viewResource(JSON.stringify(cidmeResource['entityContexts'][i]), (level + 1), options)
    }
  }

  if (cidmeResource.hasOwnProperty('entityContextLinks') && cidmeResource['entityContextLinks'].length > 0) {
    for (let i = 0; i < cidmeResource['entityContextLinks'].length; i++) {
      viewResource(JSON.stringify(cidmeResource['entityContextLinks'][i]), (level + 1), options)
    }
  }

  if (cidmeResource.hasOwnProperty('entityContextData') && cidmeResource['entityContextData'].length > 0) {
    for (let i = 0; i < cidmeResource['entityContextData'].length; i++) {
      viewResource(JSON.stringify(cidmeResource['entityContextData'][i]), (level + 1), options)
    }
  }

  if (cidmeResource['@type'] === 'Entity') {
    console.log(' '.repeat(level - 1) + '-------------------------------')
  }
}

// Export all methods
module.exports = { createEntityAndEntityContext, createResource, viewResource }
