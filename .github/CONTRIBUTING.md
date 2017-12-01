# Looking for Collaborators!

New contributors are always welcome to submit code, translations, and UX improvements to this 
project. We have very few requirements, and we’ll provide mentorship and guidance in the form of
code reviews for those looking to join this project!

There are [several new feature requests](https://github.com/manastungare/google-calendar-crx/labels/Feature%20Request) for you to work on, and we’ll mentor you in the process. Once your pull requests are merged in, your contributions will be available to millions of users.

Go through the list of feature requests or bugs, and pick one you’d like to tackle. We don’t want to burden you with fixing bugs; so filter the list to show only Feature Requests. 

If you have questions, feel free to comment on the specific issue, and we’ll jump in to help. When you’re done, send a pull request.

## What’s in it for you?

* Publicly-visible open-source contributions that you can highlight on your résumé.
* Mentoring from Google engineers.
* A better understanding of JavaScript, Chrome extensions.
* The satisfaction of seeing your code being used by millions of users world-wide.

# Triaging Issues

We also need help triaging issues. It is a time-consuming task, but gives you lots of context about what users are looking for, and the issues they are running into.

If you’re not a Developer, but would like to get involved in open-source, this is a great way to do that.

# Requirements

- Please accept and sign Google’s Contributor License Agreement. You’ll be prompted to do this 
  automatically when you submit a pull request.

- All JavaScript files must be formatted using the Google Style Guide.
    ```
    find . -iname "*.js" -exec sh -c 'clang-format "{}" >/tmp/tmp.js && mv /tmp/tmp.js "{}"' \;
    ```

  If you don’t have `clang-format` installed, get it from your favorite package manager.

- All JSON files must be formatted consistently with a 2-space indent. Use the following one-liner
  to automatically format all JSON files before sending out your pull request:

    ```
    find . -iname "*.json" -exec sh -c 'cat "{}" | jq . --indent 2 -r >/tmp/tmp.json && mv /tmp/tmp.json "{}"' \;
    ```

  If you don’t have `jq` installed, get it from your favorite package manager.
