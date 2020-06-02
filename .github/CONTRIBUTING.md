## Contributing

New contributors are always welcome to submit code, translations, and UX improvements to this 
project.

Please locate an existing Issue or file one yourself, and engage the community in discussion before
starting implementation.

## Requirements

- Please accept and sign Google’s Contributor License Agreement. You’ll be prompted to do this 
  automatically when you submit a pull request.

- Run `grunt` to automatically format source files and highlight potential issues. 

- Make sure to address all the issues it finds before creating a pull request.

```shell
cd src/
grunt
```

- If you don’t have `grunt` setup for this project, run this once:

```shell
# Example: using HomeBrew for Mac OS X. Use any package manager for your operating system.
brew install grunt npm   

# After `npm` is installed:
npm install -g grunt-cli
npm install grunt grunt-contrib-jshint grunt-contrib-csslint grunt-clang-format --save-dev 
```

- Do not include `package.json` or `package-lock.json` in your code commits.
