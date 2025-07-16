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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseConfig = exports.storage = exports.auth = exports.db = exports.analytics = exports.app = void 0;
exports.uploadFileToStorage = uploadFileToStorage;
exports.getMessagingInstance = getMessagingInstance;
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var analytics_1 = require("firebase/analytics");
var auth_1 = require("firebase/auth");
var storage_1 = require("firebase/storage");
var messaging_1 = require("firebase/messaging");
var firebaseConfig = {
    apiKey: "AIzaSyDacVR49IYKM5NUgP6PlchNAH02Je9AhRk",
    authDomain: "universestay-8c0e4.firebaseapp.com",
    databaseURL: "https://universestay-8c0e4-default-rtdb.firebaseio.com",
    projectId: "universestay-8c0e4",
    storageBucket: "universestay-8c0e4.appspot.com",
    messagingSenderId: "984032807399",
    appId: "1:984032807399:web:50e0cdc71b62aec99d1542",
    measurementId: "G-6RYNDDKK5L"
};
exports.firebaseConfig = firebaseConfig;
// Initialize Firebase
var app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
exports.app = app;
var analytics = typeof window !== 'undefined' ? (0, analytics_1.getAnalytics)(app) : undefined;
exports.analytics = analytics;
var db = (0, firestore_1.getFirestore)(app);
exports.db = db;
var auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
var storage = (0, storage_1.getStorage)(app);
exports.storage = storage;
function uploadFileToStorage(path, file) {
    return __awaiter(this, void 0, void 0, function () {
        var storageRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    storageRef = (0, storage_1.ref)(storage, path);
                    return [4 /*yield*/, (0, storage_1.uploadBytes)(storageRef, file)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, storage_1.getDownloadURL)(storageRef)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function getMessagingInstance() {
    return __awaiter(this, void 0, void 0, function () {
        var messaging;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof window === 'undefined')
                        return [2 /*return*/, null];
                    return [4 /*yield*/, (0, messaging_1.isSupported)()];
                case 1:
                    if (!(_a.sent()))
                        return [2 /*return*/, null];
                    messaging = (0, messaging_1.getMessaging)(app);
                    // Register the service worker for FCM
                    return [4 /*yield*/, navigator.serviceWorker.register('/firebase-messaging-sw.js')];
                case 2:
                    // Register the service worker for FCM
                    _a.sent();
                    return [2 /*return*/, messaging];
            }
        });
    });
}
