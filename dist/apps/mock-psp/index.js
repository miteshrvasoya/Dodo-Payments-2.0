"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = parseInt(process.env.PSP_PORT || '3001', 10);
app.use(express_1.default.json());
app.use(routes_1.default);
app.listen(port, () => {
    console.log(`[INFO] Mock PSP Service is running on port ${port}`);
});
