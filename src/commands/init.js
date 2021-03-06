const chalk = require('chalk')
const fetch = require('node-fetch')
const os = require('os')
const path = require('path')
const toolbox = require('gluegun/toolbox')
const {
  getSubgraphBasename,
  validateSubgraphName,
} = require('../command-helpers/subgraph')
const { withSpinner, step } = require('../command-helpers/spinner')
const { fixParameters } = require('../command-helpers/gluegun')
const { abiEvents, generateScaffold, writeScaffold } = require('../scaffold')

const HELP = `
${chalk.bold('graph init')} [options] [subgraph-name] [directory]

${chalk.dim('Options:')}

      --allow-simple-name       Use a subgraph name without a prefix (default: false)
  -h, --help                    Show usage information

${chalk.dim('Choose mode with one of:')}

      --from-contract <address> Creates a scaffold based on an existing contract
      --from-example            Creates a scaffold based on an example subgraph

${chalk.dim('Options for --from-contract:')}

      --abi <path>              Path to the contract ABI (default: download from Etherscan)
      --network <mainnet|kovan|rinkeby|ropsten>
                                Selects the network the contract is deployed to
`

const processInitForm = async (
  toolbox,
  { abi, address, allowSimpleName, directory, fromExample, network, subgraphName }
) => {
  let networkChoices = ['mainnet', 'kovan', 'rinkeby', 'ropsten']
  let addressPattern = /^(0x)?[0-9a-fA-F]{40}$/

  let abiFromEtherscan = undefined
  let abiFromFile = undefined

  let questions = [
    {
      type: 'input',
      name: 'subgraphName',
      message: 'Subgraph name',
      initial: subgraphName,
      validate: name => {
        try {
          validateSubgraphName(name, { allowSimpleName })
          return true
        } catch (e) {
          return `${e.message}

  Examples:
  
    $ graph init ${os.userInfo().username}/${name}
    $ graph init ${name} --allow-simple-name`
        }
      },
      result: value => {
        subgraphName = value
        return value
      },
    },
    {
      type: 'input',
      name: 'directory',
      message: 'Directory to create the subgraph in',
      initial: () => directory || getSubgraphBasename(subgraphName),
      validate: value =>
        toolbox.filesystem.exists(value || directory || getSubgraphBasename(subgraphName))
          ? 'Directory already exists'
          : true,
    },
    {
      type: 'select',
      name: 'network',
      message: 'Ethereum network',
      choices: networkChoices,
      skip: fromExample !== undefined,
      initial: network || 'mainnet',
      result: value => {
        network = value
        return value
      },
    },
    {
      type: 'input',
      name: 'address',
      message: 'Contract address',
      skip: fromExample !== undefined,
      initial: address,
      validate: async value => {
        if (fromExample !== undefined) {
          return true
        }

        // Validate whether the address is valid
        if (!addressPattern.test(value)) {
          return `Contract address "${value}" is invalid.
  Must be 40 hexadecimal characters, with an optional '0x' prefix.`
        }

        return true
      },
      result: async value => {
        if (fromExample !== undefined) {
          return value
        }

        // Try loading the ABI from Etherscan
        try {
          abiFromEtherscan = await loadAbiFromEtherscan(network, value)
        } catch (e) {}
        return value
      },
    },
    {
      type: 'input',
      name: 'abi',
      message: 'ABI file (path)',
      skip: () => fromExample !== undefined || abiFromEtherscan !== undefined,
      validate: async value => {
        if (fromExample || abiFromEtherscan) {
          return true
        }

        let exists = await toolbox.filesystem.exists(value)
        if (!exists) {
          return 'File does not exist.'
        } else if (exists === 'dir') {
          return 'Path points to a directory, not a file.'
        } else if (exists === 'other') {
          return 'Not sure what this path points to.'
        } else {
          abiFromFile = await toolbox.filesystem.read(value, 'json')
          return abiFromFile ? true : 'Not a valid ABI file'
        }
      },
    },
  ]

  try {
    let answers = await toolbox.prompt.ask(questions)
    return { ...answers, abi: abiFromEtherscan || abiFromFile }
  } catch (e) {
    return undefined
  }
}

const loadAbiFromEtherscan = async (network, address) =>
  await withSpinner(
    `Fetching ABI from Etherscan`,
    `Failed to fetch ABI from Etherscan`,
    `Warnings while fetching ABI from Etherscan`,
    async spinner => {
      let result = await fetch(
        `https://${
          network === 'mainnet' ? 'api' : `api-${network}`
        }.etherscan.io/api?module=contract&action=getabi&address=${address}`
      )
      let json = await result.json()
      return JSON.parse(json.result)
    }
  )

module.exports = {
  description: 'Creates a new subgraph with basic scaffolding',
  options: {
    boolean: ['from-example'],
  },
  run: async toolbox => {
    // Obtain tools
    let { print, system } = toolbox

    // Read CLI parameters
    let {
      abi,
      allowSimpleName,
      fromContract,
      fromExample,
      h,
      help,
      network,
    } = toolbox.parameters.options

    if (fromContract && fromExample) {
      print.error(`Only one of --from-example and --from-contract can be used at a time.`)
      process.exitCode = 1
      return
    }

    let subgraphName, directory
    try {
      ;[subgraphName, directory] = fixParameters(toolbox.parameters, {
        fromExample,
        allowSimpleName,
        help,
        h,
      })
    } catch (e) {
      print.error(e.message)
      process.exitCode = 1
      return
    }

    // Show help text if requested
    if (help || h) {
      print.info(HELP)
      return
    }

    // Detect git
    let git = await system.which('git')
    if (git === null) {
      print.error(
        `Git was not found on your system. Please install 'git' so it is in $PATH.`
      )
      process.exitCode = 1
      return
    }

    // Detect Yarn and/or NPM
    let yarn = await system.which('yarn')
    let npm = await system.which('npm')
    if (!yarn && !npm) {
      print.error(
        `Neither Yarn nor NPM were found on your system. Please install one of them.`
      )
      process.exitCode = 1
      return
    }

    let commands = {
      install: yarn ? 'yarn' : 'npm install',
      codegen: yarn ? 'yarn codegen' : 'npm run codegen',
      deploy: yarn ? 'yarn deploy' : 'npm run deploy',
    }

    // If all parameters are provided from the command-line,
    // go straight to creating the subgraph from the example
    if (fromExample && subgraphName && directory) {
      return await initSubgraphFromExample(
        toolbox,
        { allowSimpleName, directory, subgraphName },
        { commands }
      )
    }

    // If all parameters are provided from the command-line,
    // go straight to creating the subgraph from an existing contract
    if (fromContract && subgraphName && directory && network) {
      let abi
      try {
        abi = await loadAbiFromEtherscan(network, fromContract)
      } catch (e) {
        process.exitCode = 1
        return
      }

      return await initSubgraphFromContract(
        toolbox,
        { abi, allowSimpleName, directory, address: fromContract, network, subgraphName },
        { commands }
      )
    }

    // Otherwise, take the user through the interactive form
    let inputs = await processInitForm(toolbox, {
      abi,
      allowSimpleName,
      directory,
      address: fromContract,
      fromExample,
      network,
      subgraphName,
    })

    // Exit immediately when the form is cancelled
    if (inputs === undefined) {
      process.exit(1)
      return
    }

    print.info('———')

    if (fromExample) {
      await initSubgraphFromExample(
        toolbox,
        {
          subgraphName: inputs.subgraphName,
          directory: inputs.directory,
        },
        { commands }
      )
    } else {
      await initSubgraphFromContract(
        toolbox,
        {
          allowSimpleName,
          subgraphName: inputs.subgraphName,
          directory: inputs.directory,
          abi: inputs.abi,
          network: inputs.network,
          address: inputs.address,
        },
        { commands }
      )
    }
  },
}

const revalidateSubgraphName = async (toolbox, subgraphName, { allowSimpleName }) => {
  // Fail if the subgraph name is invalid
  try {
    validateSubgraphName(subgraphName, { allowSimpleName })
    return true
  } catch (e) {
    toolbox.print.error(`${e.message}

  Examples:

    $ graph init ${os.userInfo().username}/${subgraphName}
    $ graph init ${subgraphName} --allow-simple-name`)
    return false
  }
}

const initRepository = async (toolbox, directory) =>
  await withSpinner(
    `Initialize subgraph repository`,
    `Failed to initialize subgraph repository`,
    `Warnings while initializing subgraph repository`,
    async spinner => {
      // Remove .git dir in --from-example mode; in --from-contract, we're
      // starting from an empty directory
      let gitDir = path.join(directory, '.git')
      if (toolbox.filesystem.exists(gitDir)) {
        await toolbox.filesystem.remove(gitDir)
      }
      await toolbox.system.run('git init', { cwd: directory })
      await toolbox.system.run('git add --all', { cwd: directory })
      await toolbox.system.run('git commit -m "Initial commit"', {
        cwd: directory,
      })
      return true
    }
  )

const installDependencies = async (toolbox, directory, installCommand) =>
  await withSpinner(
    `Install dependencies with ${toolbox.print.colors.muted(installCommand)}`,
    `Failed to install dependencies`,
    `Warnings while installing dependencies`,
    async spinner => {
      await toolbox.system.run(installCommand, { cwd: directory })
      return true
    }
  )

const runCodegen = async (toolbox, directory, codegenCommand) =>
  await withSpinner(
    `Generate ABI and schema types with ${toolbox.print.colors.muted(codegenCommand)}`,
    `Failed to generate code from ABI and GraphQL schema`,
    `Warnings while generating code from ABI and GraphQL schema`,
    async spinner => {
      await toolbox.system.run(codegenCommand, { cwd: directory })
      return true
    }
  )

const printNextSteps = (toolbox, { subgraphName, directory }, { commands }) => {
  let { print } = toolbox

  let relativeDir = path.relative(process.cwd(), directory)

  // Print instructions
  print.success(
    `
Subgraph ${print.colors.blue(subgraphName)} created in ${print.colors.blue(relativeDir)}
`
  )
  print.info(`Next steps:

  1. Run \`${print.colors.muted(
    'graph auth https://api.thegraph.com/deploy/ <access-token>'
  )}\`
     to authenticate with the hosted service. You can get the access token from
     https://thegraph.com/explorer/dashboard/.

  2. Type \`${print.colors.muted(`cd ${relativeDir}`)}\` to enter the subgraph.

  3. Run \`${print.colors.muted(commands.deploy)}\` to deploy the subgraph to
     https://thegraph.com/explorer/subgraph/${subgraphName}.

Make sure to visit the documentation on https://thegraph.com/docs/ for further information.`)
}

const initSubgraphFromExample = async (
  toolbox,
  { allowSimpleName, subgraphName, directory },
  { commands }
) => {
  let { filesystem, print, system } = toolbox

  // Fail if the subgraph name is invalid
  if (!revalidateSubgraphName(toolbox, subgraphName, { allowSimpleName })) {
    process.exitCode = 1
    return
  }

  // Fail if the output directory already exists
  if (filesystem.exists(directory)) {
    print.error(`Directory or file "${directory}" already exists`)
    process.exitCode = 1
    return
  }

  // Clone the example subgraph repository
  let cloned = await withSpinner(
    `Cloning example subgraph`,
    `Failed to clone example subgraph`,
    `Warnings while cloning example subgraph`,
    async spinner => {
      await system.run(
        `git clone http://github.com/graphprotocol/example-subgraph ${directory}`
      )
      return true
    }
  )
  if (!cloned) {
    process.exitCode = 1
    return
  }

  // Update package.json to match the subgraph name
  let prepared = await withSpinner(
    `Update subgraph name and commands in package.json`,
    `Failed to update subgraph name and commands in package.json`,
    `Warnings while updating subgraph name and commands in package.json`,
    async spinner => {
      try {
        // Load package.json
        let pkgJsonFilename = filesystem.path(directory, 'package.json')
        let pkgJson = await filesystem.read(pkgJsonFilename, 'json')

        pkgJson.name = getSubgraphBasename(subgraphName)
        Object.keys(pkgJson.scripts).forEach(name => {
          pkgJson.scripts[name] = pkgJson.scripts[name].replace('example', subgraphName)
        })
        delete pkgJson['license']
        delete pkgJson['repository']

        // Write package.json
        await filesystem.write(pkgJsonFilename, pkgJson, { jsonIndent: 2 })
        return true
      } catch (e) {
        print.error(`Failed to preconfigure the subgraph: ${e}`)
        filesystem.remove(directory)
        return false
      }
    }
  )
  if (!prepared) {
    process.exitCode = 1
    return
  }

  // Initialize a fresh Git repository
  let repo = await initRepository(toolbox, directory)
  if (repo !== true) {
    process.exitCode = 1
    return
  }

  // Install dependencies
  let installed = await installDependencies(toolbox, directory, commands.install)
  if (installed !== true) {
    process.exitCode = 1
    return
  }

  // Run code-generation
  let codegen = await runCodegen(toolbox, directory, commands.codegen)
  if (codegen !== true) {
    process.exitCode = 1
    return
  }

  printNextSteps(toolbox, { subgraphName, directory }, { commands })
}

const initSubgraphFromContract = async (
  toolbox,
  { allowSimpleName, subgraphName, directory, abi, network, address },
  { commands }
) => {
  let { print } = toolbox

  // Fail if the subgraph name is invalid
  if (!revalidateSubgraphName(toolbox, subgraphName, { allowSimpleName })) {
    process.exitCode = 1
    return
  }

  // Fail if the output directory already exists
  if (toolbox.filesystem.exists(directory)) {
    print.error(`Directory or file "${directory}" already exists`)
    process.exitCode = 1
    return
  }

  if (abiEvents(abi).length === 0) {
    // Fail if the ABI does not contain any events
    print.error(`ABI does not contain any events`)
    process.exitCode = 1
    return
  }

  // Scaffold subgraph from ABI
  let scaffold = await withSpinner(
    `Create subgraph scaffold`,
    `Failed to create subgraph scaffold`,
    `Warnings while creating subgraph scaffold`,
    async spinner => {
      let scaffold = await generateScaffold(
        {
          subgraphName,
          abi,
          network,
          address,
        },
        spinner
      )
      await writeScaffold(scaffold, directory, spinner)
      return true
    }
  )
  if (scaffold !== true) {
    process.exitCode = 1
    return
  }

  // Initialize a fresh Git repository
  let repo = await initRepository(toolbox, directory)
  if (repo !== true) {
    process.exitCode = 1
    return
  }

  // Install dependencies
  let installed = await installDependencies(toolbox, directory, commands.install)
  if (installed !== true) {
    process.exitCode = 1
    return
  }

  // Run code-generation
  let codegen = await runCodegen(toolbox, directory, commands.codegen)
  if (codegen !== true) {
    process.exitCode = 1
    return
  }

  printNextSteps(toolbox, { subgraphName, directory }, { commands })
}
