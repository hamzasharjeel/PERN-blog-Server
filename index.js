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
const express = require('express');
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const jwtSecret = "mysecret";
const port = process.env.PORT || 5000;
const cors = require('cors');

const corsOptions = {
  origin: '*', // Allow requests from any origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow the specified HTTP methods
};
app.use(express.json());
app.use(cors(corsOptions));
const verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res.json({ msg: "no token found for this user" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, jwtSecret);
        req.users = decoded;
        next();
    }
    catch (error) {
        console.log(error.message);
    }
};

app.get('/', (req, res) => {
    res.json({msg: 'welcome'});
})

app.post("/api/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, isAdmin } = req.body;
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 5);
        const user = yield prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                isAdmin,
            },
        });
        if (!user) {
            res.json({ msg: "credentials missing" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, jwtSecret, {
            expiresIn: "1hr",
        });
        res.json({ msg: "success", user: user, token: token });
    }
    catch (error) {
        res.json({ msg: "error", error: error.message });
    }
}));
app.post("/api/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: email,
        });
        const passwordMatched = yield bcrypt_1.default.compare(password, user.password);
        if (!passwordMatched) {
            res.json({ msg: "password not matched" });
        }
        res.json({ msg: "password match success", user: user });
    }
    catch (error) {
        res.json({ msg: error.message });
    }
}));
app.post("/api/create-profile", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, age, profesion } = req.body;
    try {
        const profile = yield prisma.profile.create({
            data: {
                status,
                age,
                profesion
            },
        });
        if (!profile) {
            res.json({ msg: "credentials missing" });
        }
        res.json({ msg: "success", profile });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.get('/api/admins', verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admins = yield prisma.user.findMany({
            where: {
                isAdmin: true
            }
        });
        if (!admins) {
            res.json({ msg: 'no admin found' });
        }
        res.json({ msg: 'success', admins: admins });
    }
    catch (error) {
        res.json({ msg: 'error', error: error.message });
    }
}));
app.get('/api/admins/:id', verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const admin = yield prisma.user.findUnique({
            where: {
                isAdmin: true,
                id: Number(id)
            }
        });
        if (!admin) {
            res.json({ msg: 'no admin found' });
        }
        res.json({ msg: 'success', admin: admin });
    }
    catch (error) {
        res.json({ msg: 'error', error: error.message });
    }
}));
app.put("/api/update-profile/:id", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, age, profesion } = req.body;
    const { id } = req.params;
    try {
        const profile = yield prisma.profile.update({
            where: {
                id: Number(id)
            },
            data: {
                status,
                age,
                profesion,
            },
        });
        if (!profile) {
            res.json({ msg: "credentials missing" });
        }
        res.json({ msg: "success", profile });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.delete("/api/delete-profile/:id", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const profile = yield prisma.profile.delete({
            where: {
                id: Number(id)
            }
        });
        if (!profile) {
            res.json({ msg: "profile not deleted" });
        }
        res.json({ msg: "deleted the profile" });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.get("/api/users", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        if (!users) {
            return res.json({ msg: "credentials missing" });
        }
        res.json({ msg: "success", users });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.get("/api/users/:id", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const user = yield prisma.user.findUnique({
            where: { id: Number(id) },
        });
        if (!user) {
            res.json({ msg: "no user found" });
        }
        res.json({ msg: "success", user });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.get("/api/profiles/:id", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const profile = yield prisma.profile.findUnique({
            where: { id: Number(id) },
        });
        if (!profile) {
            res.json({ msg: "no profile found" });
        }
        res.json({ msg: "success", profile });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.get("/api/posts/:id", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const post = yield prisma.posts.findUnique({
            where: { id: Number(id) },
        });
        if (!post) {
            res.json({ msg: "no profile found" });
        }
        res.json({ msg: "success", post });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.get("/api/posts", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield prisma.posts.findMany();
        if (!posts) {
            res.json({ msg: "no profiles found" });
        }
        res.json({ msg: "success", posts });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.post("/api/create-post", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description } = req.body;
    try {
        const post = yield prisma.posts.create({
            data: {
                title, description, createdAt: ''
            }
        });
        if (!post) {
            res.json({ msg: 'post failed' });
        }
        res.json({ msg: 'success', post: post });
    }
    catch (error) {
    }
}));
app.get("/api/profiles", verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profiles = yield prisma.profile.findMany();
        if (!profiles) {
            res.json({ msg: "no profiles found" });
        }
        res.json({ msg: "success", profiles });
    }
    catch (error) {
        res.json({ error: error.message });
    }
}));
app.listen(port, () => {
    console.log("the server is running on port " + port);
});
