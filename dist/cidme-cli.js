#!/usr/bin/env node
/**
 * @file CIDME CLI using Node.  Currently supports CIDME specification version 0.3.0.
 * @author Joe Thielen <joe@joethielen.com>
 * @copyright Joe Thielen 2018-2019
 * @license MIT
 */

'use strict'

const program = require('commander')
let fs = require('fs')

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

// let Cidme = require('cidme')
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

const createResource = (resourceType, parentId, cidmeResourceJSON, createMetadata, creatorId, rdfData) => {
  if (!resourceType) {
    console.log('ERROR: Resource type to create must be specified.')
    return false
  }

  let newOptions = []
  newOptions.createMetadata = createMetadata
  newOptions.creatorId = creatorId
  newOptions.data = false
  if (!rdfData) {} else {
    try {
      var rdfDataJson = JSON.parse(rdfData)
    } catch (err) {
      console.log('The provided RDF JSON string is not valid.')
      return false
    }

    newOptions.data = rdfDataJson
  }

  let data = false
  if (resourceType === 'Entity') {
    data = cidme.createEntityResource(newOptions)
  } else if (resourceType === 'MetadataGroup') {
    data = cidme.createMetadataGroupResource(parentId, newOptions)
  } else if (resourceType === 'EntityContext') {
    data = cidme.createEntityContextResource(parentId, newOptions)
  } else if (resourceType === 'EntityContextLinkGroup') {
    data = cidme.createEntityContextLinkGroupResource(parentId, newOptions)
  } else if (resourceType === 'EntityContextDataGroup') {
    data = cidme.createEntityContextDataGroupResource(parentId, newOptions)
  } else {
    console.log('ERROR: Incorrect Resource type specified.  Correct types are Entity, EntityContext, EntityContextLinkGroup, EntityContextDataGroup, or MetadataGroup.')
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

          if (
            cidmeResource['data'][i]['@type'] === 'CreatedMetadata' ||
            cidmeResource['data'][i]['@type'] === 'ModifiedMetadata' ||
            cidmeResource['data'][i]['@type'] === 'LastModifiedMetadata'
          ) {
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
    cidmeResource['@type'] === 'EntityContextDataGroup' ||
    cidmeResource['@type'] === 'EntityContextLinkGroup' ||
    (
      cidmeResource['@type'] === 'MetadataGroup' &&
      (
        !doNotShowMetadata ||
            !noMetadata
      )
    )
  ) {
    if (
      cidmeResource.hasOwnProperty('data') &&
        cidmeResource['data'].length > 0
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
    console.log('    '.repeat(level - 1) + 'CONTEXTS:')

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

program
  .version('0.4.1')
  .description('CLI for CIDME')
  .option('-c, --creatorId <creatorId>', 'A CIDME resource ID to use as creator ID for applicable metadata.')
  .option('-d, --data <data>', 'A JSON-LD resource string representing RDF data.  Will be included if creating a MetadataGroup, EntityContextLinkGroup, or EntityContextDataGroup resource.')
  .option('-f, --dataFile <filename>', 'A file containing a JSON-LD resource string representing RDF data.  Will be included if creating a MetadataGroup, EntityContextLinkGroup, or EntityContextDataGroup resource.')
  .option('-i, --input <filename>', 'File to read input from, for applicable commands.')
  .option('-n, --nometadata', 'If creating/updating resources, do not automatically create Created/Modified/LastModified Metadata resources.  If viewing resources, do not display these resources.')
  .option('-o, --output <filename>', 'File to write output to, for applicable commands.')
  .option('-p, --parent <parentId>', 'A CIDME resource ID to use as parentID, for applicable commands.')

// DO NOT SHOW HELP HERE UNTIL AFTER ALL COMMANDS ARE DEFINED, OTHERWISE
// COMMANDS WILL BE SHOWN.

program
  .command('createResource <resourceType>')
  .description('Create a new resource, specify type.  Requires use of -p/--parent option unless requesting a new entity.')
  .action((resourceType) => {
    if (!resourceType) {
      console.log('ERROR: Resource type to create must be specified.')
    } else if (resourceType !== 'Entity' && !program.parent) {
      console.log('ERROR: Parent CIDME resource ID must be specified using -p/--parent.')
    } else {
      let fileContents = null
      let createMetadata = true
      if (!program.nometadata) {} else { createMetadata = false }

      let creatorId = false
      if (!program.creatorId) {} else { creatorId = program.creatorId }

      let rdfData = false
      if (!program.dataFile) {
        if (!program.data) {} else { rdfData = program.data }
      } else {
        let fileContents = false

        if (fs.existsSync(program.dataFile)) {
          fileContents = fs.readFileSync(program.dataFile, 'utf8')
        } else {
          console.log('ERROR: The specified RDF data file does not exist!')
        }

        try {
          rdfData = JSON.parse(fileContents)
        } catch (err) {
          console.log('The provided RDF data file is not valid JSON.')
          return false
        }

        rdfData = JSON.stringify(rdfData)
      }

      let data = createResource(resourceType, program.parent, null, createMetadata, creatorId, rdfData)

      if (!data) {
        console.log('ERROR: An error occured creating new CIDME resource.')
      } else {
        if (!program.input) {
          if (!program.output) {
            console.log(JSON.stringify(data))
          } else {
            // let fileContents = fs.writeFileSync(program.output, JSON.stringify(data), 'utf8')
            fs.writeFileSync(program.output, JSON.stringify(data), 'utf8')
          }
        } else {
          if (fs.existsSync(program.input)) {
            fileContents = fs.readFileSync(program.input, 'utf8')

            let newData = createResource(resourceType, program.parent, fileContents, createMetadata, creatorId, rdfData)

            if (!newData) {
              console.log('ERROR: An error occured creating new CIDME resource.')
            } else {
              if (!program.output) {
                console.log(JSON.stringify(newData))
              } else {
                // let fileContents = fs.writeFileSync(program.output, JSON.stringify(newData), 'utf8')
                fs.writeFileSync(program.output, JSON.stringify(newData), 'utf8')
              }
            }
          } else {
            console.log('ERROR: The specified file does not exist!')
          }
        }
      }
    }
  })

program
  .command('createEntityAndEntityContext [entityContextsNum]')
  .description('Create a new entity resource and one or more entity context resources.')
  .action((entityContextsNum) => {
    let createMetadata = true
    if (!program.nometadata) {} else { createMetadata = false }

    let creatorId = false
    if (!program.creatorId) {} else { creatorId = program.creatorId }

    let data = createEntityAndEntityContext(entityContextsNum, createMetadata, creatorId)

    if (!data) {
      console.log('ERROR: An error occured creating new CIDME entity/context.')
    } if (!program.output) {
      console.log(JSON.stringify(data))
    } else {
      // console.log(typeof program.output);
      // let fileContents = fs.writeFileSync(program.output, JSON.stringify(data), 'utf8')
      fs.writeFileSync(program.output, JSON.stringify(data), 'utf8')
    }
  })

program
  .command('viewFile')
  .description('View a CIDME resource whose contents are located in the specified file.  Requires use of -i/--input option.')
  .action(() => {
    let fileContents = false

    let options = []
    options.noMetadata = program.nometadata

    if (!program.input) {
      console.log('ERROR: No input file specified.')
    } else if (fs.existsSync(program.input)) {
      fileContents = fs.readFileSync(program.input, 'utf8')
    } else {
      console.log('ERROR: The specified file does not exist!')
    }

    if (!fileContents) {
      console.log('ERROR: An error occured while reading the contents of the specified file.')
    } else {
      viewResource(fileContents, 1, options)
    }
  })

program
  .command('view <cidmeResourceJsonString>')
  .description('View a CIDME resource whose contents are located in the specified JSON string.')
  .action((cidmeResourceJsonString) => {
    let options = []
    options.noMetadata = program.nometadata

    viewResource(cidmeResourceJsonString, 1, options)
  })

// If no recognized option is given, show help.
// KEEP HELP OPTIONS AT THE END, OTHERWISE HELP WILL NOT SHOW ABOVE DESCRIBED
// COMMANDS (due to them not being described yet).
program
  .action(() => {
    program.help()
  })

// If no options supplied, show help.
// KEEP HELP OPTIONS AT THE END, OTHERWISE HELP WILL NOT SHOW ABOVE DESCRIBED
// COMMANDS (due to them not being described yet).
if (!process.argv.slice(2).length) {
  program.help()
}

program.parse(process.argv)
