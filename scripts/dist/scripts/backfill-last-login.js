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
var firestore_1 = require("firebase/firestore");
var app_1 = require("firebase/app");
var firebase_1 = require("../lib/firebase");
// Initialize Firebase app if not already initialized
var app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebase_1.firebaseConfig) : (0, app_1.getApps)()[0];
var db = (0, firestore_1.getFirestore)(app);
function backfillLastLogin() {
    return __awaiter(this, void 0, void 0, function () {
        var usersCol, usersSnap, updated, _i, _a, userDoc, data, lastLogin, d;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    usersCol = (0, firestore_1.collection)(db, 'users');
                    return [4 /*yield*/, (0, firestore_1.getDocs)(usersCol)];
                case 1:
                    usersSnap = _b.sent();
                    updated = 0;
                    _i = 0, _a = usersSnap.docs;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    userDoc = _a[_i];
                    data = userDoc.data();
                    if (!!data.last_login) return [3 /*break*/, 4];
                    lastLogin = void 0;
                    if (data.created_at) {
                        if (typeof data.created_at === 'string') {
                            d = new Date(data.created_at);
                            lastLogin = isNaN(d.getTime()) ? (0, firestore_1.serverTimestamp)() : firestore_1.Timestamp.fromDate(d);
                        }
                        else if (data.created_at.toDate) {
                            // Firestore Timestamp
                            lastLogin = data.created_at;
                        }
                        else if (data.created_at instanceof Date) {
                            lastLogin = firestore_1.Timestamp.fromDate(data.created_at);
                        }
                        else {
                            lastLogin = (0, firestore_1.serverTimestamp)();
                        }
                    }
                    else {
                        lastLogin = (0, firestore_1.serverTimestamp)();
                    }
                    return [4 /*yield*/, (0, firestore_1.updateDoc)((0, firestore_1.doc)(db, 'users', userDoc.id), {
                            last_login: lastLogin,
                        })];
                case 3:
                    _b.sent();
                    updated++;
                    console.log("Updated last_login for user ".concat(userDoc.id));
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("Backfill complete. Updated ".concat(updated, " users."));
                    return [2 /*return*/];
            }
        });
    });
}
backfillLastLogin().catch(function (err) {
    console.error('Error during backfill:', err);
    process.exit(1);
});
