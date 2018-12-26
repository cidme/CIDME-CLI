#!/usr/bin/env node

const program = require('commander');
let fs = require('fs');

const {createEntityAndEntityContext, createResource, viewResource} = require('./logic');


program
  .version('0.2.0')
  .description('CLI for CIDME')
  .option('-i, --input <filename>', 'File to read input from, for applicable commands.')
  .option('-n, --nometadata', 'If creating/updating resources, do not automatically create CreatedMetadata or UpdatedMetadata resources.  If viewing resources, do not display CreatedMetadata or UpdatedMetadata resources.')
  .option('-o, --output <filename>', 'File to write output to, for applicable commands.')
  .option('-p, --parent <parentId>', 'A CIDME resource ID to use as parentID, for applicable commands.')
  .option('-c, --creatorId <creatorId>', 'A CIDME resource ID to use as creator ID for applicable metadata.');


// DO NOT SHOW HELP HERE UNTIL AFTER ALL COMMANDS ARE DEFINED, OTHERWISE 
// COMMANDS WILL BE SHOWN.


program
  .command('createResource <resourceType>')
  .description('Create a new resource, specify type.  Requires use of -p/--parent option unless requesting a new entity.')
  .action((resourceType) => {

      if (!resourceType) {
          console.log('ERROR: Resource type to create must be specified.');
      } else if (resourceType !== 'Entity' && !program.parent) {
          console.log('ERROR: Parent CIDME resource ID must be specified using -p/--parent.');
      } else {
        let createMetadata = true;
        if (!program.nometadata) {} else {createMetadata = false;} 

        let creatorId = false;
        if (!program.creatorId) {} else {creatorId = program.creatorId;} 

        let data = createResource(resourceType, program.parent, null, createMetadata, creatorId);

        if (!data) {
          console.log('ERROR: An error occured creating new CIDME resource.');
        } else {
          if (!program.input) {
            if (!program.output) {
              console.log(JSON.stringify(data));
            } else {
              let fileContents = fs.writeFileSync(program.output, JSON.stringify(data), 'utf8');
            }
          } else {
            if (fs.existsSync(program.input)) {
              fileContents = fs.readFileSync(program.input, 'utf8');

              let newData = createResource(resourceType, program.parent, fileContents, createMetadata, creatorId);

              if (!newData) {
                console.log('ERROR: An error occured creating new CIDME resource.');
              } else {
                if (!program.output) {
                  console.log(JSON.stringify(newData));
                } else {
                  let fileContents = fs.writeFileSync(program.output, JSON.stringify(newData), 'utf8');
                }
              }
            } else {
              console.log('ERROR: The specified file does not exist!');
            }
          }
        }
      }
  });


program
  .command('createEntityAndEntityContext [entityContextsNum]')
  .description('Create a new entity resource and one or more entity context resources.')
  .action((entityContextsNum) => {
      let createMetadata = true;
      if (!program.nometadata) {} else {createMetadata = false;} 

      let creatorId = false;
      if (!program.creatorId) {} else {creatorId = program.creatorId;} 

      let data = createEntityAndEntityContext(entityContextsNum, createMetadata, creatorId);

      if (!data) {
          console.log('ERROR: An error occured creating new CIDME entity/context.');
      } if (!program.output) {
          console.log(JSON.stringify(data));
      } else {
        //console.log(typeof program.output);
        let fileContents = fs.writeFileSync(program.output, JSON.stringify(data), 'utf8');
      }
  });


program
  .command('viewFile')
  .description('View a CIDME resource whose contents are located in the specified file.  Requires use of -i/--input option.')
  .action(() => {
      let fileContents = false;

      let options = [];
      options.noMetadata = program.nometadata;

      if (!program.input) {
          console.log('ERROR: No input file specified.');
      } else if (fs.existsSync(program.input)) {
          fileContents = fs.readFileSync(program.input, 'utf8');
      } else {
          console.log('ERROR: The specified file does not exist!');
      }

      if (!fileContents) {
          console.log('ERROR: An error occured while reading the contents of the specified file.');
      } else {
          viewResource(fileContents, 1, options);
      }
  });


program
  .command('view <cidmeResourceJsonString>')
  .description('View a CIDME resource whose contents are located in the specified JSON string.')
  .action((cidmeResourceJsonString) => {
      let options = [];
      options.noMetadata = program.nometadata;

      viewResource(cidmeResourceJsonString, 1, options);
  });


// If no recognized option is given, show help.
// KEEP HELP OPTIONS AT THE END, OTHERWISE HELP WILL NOT SHOW ABOVE DESCRIBED
// COMMANDS (due to them not being described yet).
program
  .action(() => {
    program.help();
  });


// If no options supplied, show help.
// KEEP HELP OPTIONS AT THE END, OTHERWISE HELP WILL NOT SHOW ABOVE DESCRIBED
// COMMANDS (due to them not being described yet).
if (!process.argv.slice(2).length) {
  program.help();
}

program.parse(process.argv);

