# brightspace-console
A web-based CLI for common D2L Brightspace admin functions and API access. Based on JQuery Console.

See https://github.com/chrisdone/jquery-console for info about the console.

To install in Brightspace:

Download the ZIP file
Create a new folder within the /shared/ directory of Brightspace's Public Files.
Upload the brightspace-console.zip file to it and unzip


Creating a link to the Console:

In the Navigation and Themes admin tool, create a new Custom link
```
URL: https://yoursite.brightspace.com/shared/path-to-console/console.html?ou={OrgUnitId}
```
Important: you need to use the full URL, a relative path starting with /shared won’t work
Set it to open in the Same Window
Set availability for your admin level roles as appropriate
Add the custom link to a navbar
