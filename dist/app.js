"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_engine_1 = __importDefault(require("./image-engine/image-engine"));
const gif_engine_1 = __importDefault(require("./gif-engine/gif-engine"));
const oalenglish_dictionary_1 = __importDefault(require("./oalenglish-dictionary/oalenglish-dictionary"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const word = 'fuck';
    let reuslt = yield (0, oalenglish_dictionary_1.default)().searchWord(word);
    console.log(reuslt);
    reuslt = yield (0, image_engine_1.default)().search(word);
    console.log(reuslt);
    reuslt = yield (0, gif_engine_1.default)().search(word);
    console.log(reuslt);
}))();
