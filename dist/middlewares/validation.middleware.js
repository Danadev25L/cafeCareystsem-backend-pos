"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const errors_1 = require("../utils/errors");
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => `${err.msg} (${err.type})`).join(', ');
            next(new errors_1.ValidationError(errorMessages));
            return;
        }
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.middleware.js.map