
export const checkSignupValid = (firstName, lastName, username, password, email, day, month, year) => {
    let emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let monthHave30days = ["April", "June", "September", "November"];
    let monthHave31days = ["January", "March", "May", "July", "August", "October", "December"];
    let specialMonth = "February";

    let error = {}

    if (firstName === "") {
        error["firstName"] = "First name cannot be empty";
        return error;
    }

    if (!isNaN(parseInt(firstName))) {
        error["firstName"] = "First name cannot be number";
        return error;
    } else {
        error["firstName"] = "";
    }

    if (lastName === "") {
        error["lastName"] = "Last name cannot be empty";
        return error;
    }

    if (!isNaN(parseInt(lastName))) {
        error["lastName"] = "Last name name cannot be number";
        return error;
    } else {
        error["lastName"] = "";
    }

    if (month === "") {
        error["dob"] = "Month cannot be empty";
        return error;
    }

    if (day === "") {
        error["dob"] = "Day cannot be empty";
        return error;
    }

    if (isNaN(day)) {
        error["dob"] = "Invalid day";
        return error;
    } else {
        error["dob"] = "";
    }

    if (year === "") {
        error["dob"] = "Year cannot be empty";
        return error;
    }

    if (isNaN(year)) {
        error["dob"] = "Invalid year";
        return error;
    } else {
        error["dob"] = "";
    }

    if (parseInt(year) >= 1900 && parseInt(year) <= new Date().getFullYear()) {
        if (monthHave30days.includes(month)) {
            if (parseInt(day) > 30 || parseInt(day) < 1) {
                error["dob"] = `Invalid day in ${month}`;
                return error;
            }
        }

        if (monthHave31days.includes(month)) {
            if (parseInt(day) > 31 || parseInt(day) < 1) {
                error["dob"] = `Invalid day in ${month}`;
                return error;
            }
        }

        if (month === specialMonth) {
            if ((parseInt(year) % 400 === 0 || parseInt(year) % 100 !== 0) && (year % 4 === 0)) {
                if (parseInt(day) > 29 || parseInt(day) < 1) {
                    error["dob"] = `Invalid day in ${month}`;
                    return error;
                }
            } else {
                if (parseInt(day) > 28 || parseInt(day) < 1) {
                    error["dob"] = `Invalid day in ${month}`;
                    return error;
                }
            }
        }
    } else {
        error["dob"] = "Invalid year";
        return error;
    }

    if (username === "") {
        error["username"] = "Username cannot be empty";
        return error;
    } else {
        error["username"] = "";
    }

    if (password === "") {
        error["password"] = "Password cannot be empty";
        return error;
    } else {
        error["password"] = "";
    }

    if (email === "") {
        error["email"] = "Email cannot be empty";
        return error;
    }

    if (!email.match(emailFormat)) {
        error["email"] = "Invalid email address";
        return error;
    } else {
        error["email"] = "";
    }

    return "";
}


export const checkLoginValid = (username, password) => {
    if (username === "") {
        return "Username cannot be empty";
    }

    if (password === "") {
        return "Password cannot be empty";
    }
    
    return ""
}