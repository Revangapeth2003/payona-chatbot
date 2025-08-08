"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMessage = exports.getMessages = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const getMessages = async (_req, res) => {
    try {
        const messages = await Message_1.default.find();
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getMessages = getMessages;
const saveMessage = async (req, res) => {
    const { text, sender } = req.body;
    if (!text || !sender) {
        return res.status(400).json({ error: 'Text and sender required' });
    }
    try {
        const message = new Message_1.default({ text, sender });
        await message.save();
        res.status(201).json(message);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.saveMessage = saveMessage;
