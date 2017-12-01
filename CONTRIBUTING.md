# Contributors Welcome!

New contributors are always welcome to submit code, translations, and UX improvements to this 
project. We have very few requirements, and we’ll provide mentorship and guidance in the form of
code reviews for those looking to join this project!

# Requirements

- Please accept and sign Google’s Contributor License Agreement. You’ll be prompted to do this 
  automatically when you submit a pull request.

- All JavaScript files must be formatted using the Google Style Guide.

- All JSON files must be formatted consistently with a 2-space indent. Use the following one-liner
  to automatically format all JSON files before sending out your pull request:

    ```
    find . -iname "*.json" -exec sh -c 'cat "{}" | jq . --indent 2 -r >/tmp/tmp.json && mv /tmp/tmp.json "{}"' \;
    ```

  If you don’t have `jq` installed, get it from your favorite package manager.
