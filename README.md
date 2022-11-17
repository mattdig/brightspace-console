# brightspace-console
A web-based CLI for common D2L Brightspace admin functions and API access. Based on JQuery Console.

See https://github.com/chrisdone/jquery-console for info about the console.

What does it do? Currently only 5 commands are supported:
* help: displays the other available commands
* enrollemnt: shows the academic courses a user is enrolled in, with links to the courses
* impersonnate: initiates an impersnation session of a given user
* user: shows basic info about a user, JSON format
* api: lets you run get, put, post, delete commands directly to the Brightspace API, and submit forms if the correct data is provided
* type each command alone for usage instructions

Running API commands:
* The api command automatically replaces the "/(version)/" in the API example URLS with defined versions in js/brightspace.js, so you don't have to do it every time.
* The JSON Input and Output fieds are used only for the api command
* "api submit <url>" is used for submitting form data, simulating Brightpsace's internal features and can't be used with regular API calls, input must still be in JSON

To install in Brightspace:
* Download the ZIP file
* Create a new folder within the /shared/ directory of Brightspace's Public Files.
* Upload the brightspace-console.zip file to it and unzip

Creating a link to the Console:
* In the Navigation and Themes admin tool, create a new Custom link
* Set the URL:
```
https://yoursite.brightspace.com/shared/path-to-console/console.html?ou={OrgUnitId}
```
* Important: you need to use the full URL, a relative path starting with /shared won’t work
* Set it to open in the Same Window
* Set availability for your admin level roles as appropriate
* Add the custom link to a navbar
