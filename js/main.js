const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) });
const WORKING_OU = params.ou;
const bs = new Brightspace(WORKING_OU);
let BASE_OU = false;

bs.get('/d2l/api/lp/(version)/organization/info').then((response) => {
    BASE_OU = response.Identifier;
});

let CONSOLE;


$(document).ready(function () {
    /* Fifth console */
    let user_commands = ['api', 'classlist', 'enrol', 'enrolment', 'impersonate', 'user'];
    user_commands.sort();
    let all_commands = ['help'].concat(user_commands);
    
    CONSOLE = $('#console').console({
        welcomeMessage: 'Welcome to the console! Type "help" to see the list of commands.\n&&uarr; or &&darr; to scroll through your command history. TAB to autocomplete commands.',
        promptLabel: 'D2L> ',
        commandHandle: async function (line) {

            if (line) {

                // trim line and remove double spaces
                line = line.trim().replace(/\s+/g, ' ');

                let m = 'Command not recognized';
                let c = 'jquery-console-message-value';
                let response;

                let commandParts = line.split(' ');

                commandParts[0] = commandParts[0].toLowerCase();
                
                if (commandParts[0] == "help") {
                    m = "Supported commands: " + user_commands.join(", ");
                } else if (commandParts[0] == 'api') {

                    if (commandParts.length == 3) {
                        let method = commandParts[1].toLowerCase();;
                        let url = commandParts[2];
                        let data = null;
                        if (method == 'put' || method == 'post' || method == 'submit') {
                            let json = $('#json_input').val();
                            
                            try{
                                data = JSON.parse(json);
                            }catch(e){
                                m = 'Error: Invalid JSON';
                            }
                        }

                        if(method == 'get' || data !== null){
                            m = "Calling " + method + " " + url + "\n";
                            m += "See \"JSON Output\" for result. ";
                            api_call(method, url, data);
                        }

                    } else {
                        m = "Usage: api <method> <url>\nUse the \"JSON Input\" field to input data\n";
                        m += ' <<a href="https://docs.valence.desire2learn.com/reference.html">>Brightspace API Reference<</a>>';
                    }

                } else if (commandParts[0] == 'classlist') {

                    if(commandParts.length == 2){
                        let ou = parseInt(commandParts[1]);
                        let response = await bs.get('/d2l/api/le/(version)/' + ou + '/classlist/');

                        if(typeof response == 'object' && !('Error' in response)){
                            m = '';
                            for(user of response){
                                m += '<<a onclick="impersonate(\'-i -x ' + user.Identifier + '\');">>' + 
                                user.DisplayName + " | " + user.OrgDefinedId + " | " + user.ClasslistRoleDisplayName + 
                                "<</a>>\n";
                            }
                        } else {
                            m = 'Error: No enrolments found in that course';
                        }

                    } else {
                        m = "Usage: classlist <org-unit-id>";
                    }

                } else if (commandParts[0] == 'enrol' || commandParts[0] == 'enroll') {
                    if (commandParts.length >= 2) {

                        let user = false;
                        let role = false;
                        let ou = false;

                        for(let i = 1; i < commandParts.length; i++){
                            if(commandParts[i] == '-u'){
                                user = commandParts[++i];
                            } else if(commandParts[i] == '-r'){
                                
                                if(commandParts[i+1].slice(0,1) == '"'){
                                    
                                    let tempRole = commandParts[++i].slice(1);

                                    for(let j = i + 1; j < commandParts.length; j++){
                                        if(commandParts[j].slice(-1) == '"'){
                                            role = tempRole + " " + commandParts[j].slice(0,-1);
                                            i = j;
                                            break;
                                        } else {
                                            tempRole += " " + commandParts[j];
                                        }
                                    }

                                    if(role == false){
                                        m = "Error: Invalid role";
                                        break;
                                    }
                                    
                                } else {
                                    role = commandParts[++i];
                                }
                            } else if(commandParts[i] == '-o'){
                                ou = commandParts[++i];
                            }
                        }
                        
                        if(user !== false && role !== false && ou !== false){
                            let response = await enrol_user(user, role, ou);
                            m = response;
                        }

                    } else {
                        m = "Usage: enrol -u <username|email|banner-id> -r <role-id|role-name> -o <org-unit-id>";
                    }
                } else if (commandParts[0] == 'enrolment' || commandParts[0] == 'enrollment') {
                    try {

                        let flag = '';
                        let identifier = commandParts[1].toLowerCase();;

                        if (commandParts.length > 2 && commandParts[1] == '-i') {
                            flag = commandParts[1] + ' ';
                            identifier = commandParts[2];
                        }

                        let response = await enrollment_status(flag + identifier);

                        m = response;

                    } catch (e){
                        m = "Usage: enrolment <username|email|banner-id> or -i <user-id>";
                    }
                } else if (commandParts[0] == "impersonate") {

                    let usage = "Usage: impersonate <username|email|banner-id> or -i <user-id>\To cancel: exit";

                    if (commandParts.length >= 2) {

                        let flags = '';
                        let identifier;

                        if (commandParts.indexOf('-i') != -1){
                            flags += '-i ';
                            commandParts.splice(commandParts.indexOf('-i'), 1);
                        }

                        if(commandParts.indexOf('-x') != -1){
                            flags += '-x ';
                            commandParts.splice(commandParts.indexOf('-x'), 1);
                        }

                        if(commandParts.length != 2){
                            m = usage;
                         
                        } else {

                            identifier = commandParts[1];

                            response = await impersonate(flags + identifier);
                            m = response;
                        
                        }

                    } else {
                        m = usage;
                    }
                } else if (commandParts[0] == 'user') {

                    if (commandParts.length >= 2) {
                        let flag = '';
                        let identifier = commandParts[1].toLowerCase();;

                        if (commandParts.length > 2 && commandParts[1] == '-i') {
                            flag = commandParts[1] + ' ';
                            identifier = commandParts[2];
                        }

                        let response = await user_info(flag + identifier);

                        if (typeof response == 'object') {

                            m = response.FirstName + " " + response.LastName + " (" + response.UserName + " | " + response.OrgDefinedId + "):\n";

                            let orgRole = await bs.get('/d2l/api/lp/(version)/enrollments/users/' + response.UserId + '/orgunits/' + BASE_OU);

                            let roleData = await bs.get('/d2l/api/lp/(version)/roles/' + orgRole.RoleId);

                            m += "Org-level Role: " + roleData.DisplayName + "\n";

                            m += JSON.stringify(response, null, 2);
                        } else {
                            m = 'Error: User not found';
                        }

                    } else {
                        m = "Usage: user <username|email|banner-id>\nor\nuser -i <user-id>";
                    }
                } else if (commandParts[0] == "exit") {
                    m = "Ending impersonation...";
                    let data = {
                        "isXhr": true,
                        "requestId": 2
                    };
                    let response = await bs.submit('/d2l/lp/impersonation/Restore', data);
                } else {
                    c = 'jquery-console-message-error';
                }

                return [{ msg: m, className: c }];
            } else {
                return [{ msg: '', className: "jquery-console-message-value" }];
            }
        },
        commands: all_commands,
        completeHandle: function (prefix) {
            let commands = all_commands;
            let ret = [];
            for (let i = 0; i < commands.length; i++) {
                let command = commands[i];
                if (command.lastIndexOf(prefix, 0) === 0) {
                    ret.push(command.substring(prefix.length) + ' ');
                    break;
                }
            }
            return ret;
        },
        promptHistory: true,
        storeHistory: true,
        autofocus: true
    });
});



async function impersonate(identifier) {

    let openNewTab = true;
    if (identifier.indexOf('-x') != -1) {
        openNewTab = false;
        identifier = identifier.replace('-x', '').trim().replace(/\s+/g, ' ');
    }

    let user = await user_info(identifier);

    userId = user.UserId;

    if (!userId) {
        return "Error: User not found";
    }

    let url = "/d2l/lp/manageUsers/rpc/rpc_functions.d2lfile?ou=" + BASE_OU + "&d2l_rh=rpc&d2l_rt=call";

    let data = {
        d2l_rf: 'ImpersonateUser',
        params: '{"param1":"' + userId + '","param2":"131"}',
        d2l_action: 'rpc'
    }

    let response = await bs.submit(url, data);

    if (response && response.Result !== undefined && (response.Result === null || response.Result[0] == "success")) {

        CONSOLE.report([{msg:"\n\nNow impersonating " + user.UserName + "...\n\n", className:"jquery-console-message-value"}]);

        if(openNewTab){
            window.open("/d2l/home/" + (WORKING_OU || ''), '_blank').focus();
            return "Success! Opening new page...";
        } else {
            
            return "Success!";
        }
    
    } else {
        return 'Error: impersonnation failed';
    }

}

async function enrol_user(user, role, ou) {

    let userId = await getUserId(user);

    if (!userId)
        return 'Error: user not found';

    if (typeof role == 'string') {
        role = role.toLowerCase();
        
        let roles = await bs.get('/d2l/api/lp/(version)/roles/');

        roles.forEach(element => {
            if(element.DisplayName.toLowerCase() == role){
                role = parseInt(element.Identifier);
            }
        });

        if(typeof role == 'string'){
            return 'Error: role not found';
        }
    }

    let Enrollment = {
        "OrgUnitId": ou,
        "UserId": userId,
        "RoleId": role
    }

    let enrol = await bs.post('/d2l/api/lp/(version)/enrollments/', Enrollment);

    if ('OrgUnitId' in enrol) {
        return 'Success: user enrolled';
    } else {
        return 'Error: user not enrolled';
    }
}


async function enrollment_status(identifier) {

    let courses = '';

    let user = await user_info(identifier);

    if (!user)
        return 'Error: user not found';

    courses += '<<a href="/d2l/lp/manageUsers/admin/newedit_enrollmentLog.d2l?ou=' + BASE_OU + '&d2l_isfromtab=1&uid=' + user.UserId + '">>' +
        'View Enrollment Log for ' + user.FirstName + ' ' + user.LastName + '<</a>>\n\n';   

    let url = "/d2l/api/lp/(version)/enrollments/users/" + user.UserId + "/orgUnits/";

    let response = await bs.get(url);

    if (typeof response == 'string') {
        response = JSON.parse(response);
    }

    if (response) {
        let courseArray = [];
        response.Items.forEach((course) => {
            if (course.OrgUnit.Type.Id == 3) {
                courseArray.push(' <<a href="/d2l/home/' + course.OrgUnit.Id + '">>' + course.OrgUnit.Name + " (" + course.OrgUnit.Id + ") - " + course.Role.Name + '<</a>>');
            }
        });

        courses += courseArray.join('\n');
    } else {
        courses = 'Error: no courses found';
    }

    return courses;
}

async function user_info(identifier) {

    identifier = identifier.split(' ');
    let param = 'userName';

    if (identifier.length == 2 && identifier[0] == '-i') {
        param = 'userId';
        identifier = identifier[1];
    } else {
        identifier = identifier[0];
        if (identifier.indexOf('@') != -1) {
            param = 'externalEmail';
        } else if (!isNaN(identifier)) {
            param = 'orgDefinedId';
        }
    }

    let query = (param != 'userId' ? "?" + param + "=" + identifier : identifier);

    let url = "/d2l/api/lp/(version)/users/" + query;

    let response = await bs.get(url);

    if (typeof response == 'string') {
        response = JSON.parse(response);
    }

    if (response[0] !== undefined) {
        response = response[0];
    } else if (response.UserId === undefined) {
        return false;
    }

    return response;

}

async function getUserId(identifier) {

    let user = await user_info(identifier);

    if(!user)
        return false;

    return user.UserId;
}

async function api_call(method, url, data) {

    let response = { error: "Invalid method" };

    switch (method) {

        case 'get':
            response = await bs.get(url);
            break;

        case 'post':
            response = await bs.post(url, data);
            break;

        case 'put':
            response = await bs.put(url, data);
            break;

        case 'delete':
            response = await bs.delete(url);
            break;

        case 'submit':
            response = await bs.submit(url, data);
            break;

    }

    // stringify json respones
    if (typeof response == 'object') {
        response = JSON.stringify(response, null, 2);
    }

    $('#json_output').val(response);

}