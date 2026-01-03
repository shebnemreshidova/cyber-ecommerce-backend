class CustomError extends Error {
    constructor(code, message, description) {
        super(`{"code": "${code}" , "message": "${message}" , "description": ${description} }`);
        this.code =code;
        this.message = message;
        this.description = description;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = CustomError;