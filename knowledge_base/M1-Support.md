# M1 Support

Newer Macs use Apple Silicon (M1, M2, etc) instead of the common Intel chips.

Several critical CLI tools like `nvm` and `brew` do not yet have native versions built for the new M1 architecture. A Rosetta2 terminal is required to properly install them.

For M1+ development, you should follow the same steps as in the **nvm** section, except you must make sure you are using the Rosetta2 Terminal.

1. Download a terminal alternative like [iTerm2](https://iterm2.com/) to your Applications (optionally, rename it, ie: "Rosetta Terminal").

2. In the Applications menu, right-click the new terminal app and click "Get Info."

3. From the “Get info” menu, select “Open using Rosetta“

4. Confirm that you are using a Rosetta Terminal by entering the `arch` command, which should return `i386`

5. You may now use this terminal to install `nvm` and other applications. They will run fine in your usual terminal.

_FOR ALL CLI INSTALLS_ you must prefix `arch -arm64` in front of the command.

For example for python: `arch -arm64 brew install python@3.9`. This will allow you to install using the M1 homebrew with Rosetta. This is crucial.

If errors occur try these steps:

1. Make sure homebrew is installed in the `/opt/` directory

2. If `pnpm` stalls out at node-sass, ensure that Python is installed in your Rosetta Terminal path.
