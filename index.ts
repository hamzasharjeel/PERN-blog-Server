import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const app = express();
const jwtSecret = "mysecret";
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
declare global {
  namespace Express {
    interface Request {
      users?: any;
    }
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.json({ msg: "no token found for this user" });
  }

  try {
    const decoded = jwt.verify(authHeader, jwtSecret);
    req.users = decoded;
    next();
  } catch (error: any) {
    console.log(error.message);
  }
};

app.post("/api/signup", async (req: Request, res: Response) => {
  const { name, email, password, isAdmin } = req.body;
  try {
    const hashedPassword: string = await bcrypt.hash(password, 5);
    const user: any = await prisma.user.create({
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

    const token: string = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "1hr",
    });
    res.json({ msg: "success", user: user, token: token });
  } catch (error: any) {
    res.json({ msg: "error", error: error.message });
  }
});

app.post("/api/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user: any = await prisma.user.findUnique({
      where: email,
    });
    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      res.json({ msg: "password not matched" });
    }
    res.json({ msg: "password match success", user: user });
  } catch (error: any) {
    res.json({ msg: error.message });
  }
});

app.post("/api/create-profile", verifyToken, async(req: Request, res: Response) => {
  const { status, age, profesion } = req.body;
  try {
    const profile = await prisma.profile.create({
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
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.get('/api/admins', verifyToken, async(req:Request, res: Response)=> {
    try {
        const admins = await prisma.user.findMany({
            where: {
                isAdmin: true
            }
        });
        if(!admins){
            res.json({msg: 'no admin found'});
        }
        res.json({msg: 'success', admins: admins});
    } catch (error: any) {
        res.json({msg: 'error', error: error.message});
    }
});

app.get('/api/admins/:id', verifyToken, async(req:Request, res: Response)=> {
    const { id } = req.params;
    try {
        const admin = await prisma.user.findUnique({
            where: {
                isAdmin: true,
                id: Number(id)
            }
        });
        if(!admin){
            res.json({msg: 'no admin found'});
        }
        res.json({msg: 'success', admin: admin});
    } catch (error: any) {
        res.json({msg: 'error', error: error.message});
    }
});

app.put("/api/update-profile/:id", verifyToken, async(req: Request, res: Response) => {
  const { status, age,  profesion } = req.body;
  const { id } = req.params;
  try {
    const profile = await prisma.profile.update({
        where:{
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
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.delete("/api/delete-profile/:id", verifyToken, async(req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const profile = await prisma.profile.delete({
        where: {
            id: Number(id)
        }
    });
    if (!profile) {
      res.json({ msg: "profile not deleted" });
    }
    res.json({ msg: "deleted the profile" });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.get("/api/users", verifyToken, async(req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    if (!users) {
      return res.json({ msg: "credentials missing" });
    }
    res.json({ msg: "success", users });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.get("/api/users/:id", verifyToken, async(req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!user) {
      res.json({ msg: "no user found" });
    }
    res.json({ msg: "success", user });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.get("/api/profiles/:id", verifyToken, async(req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: Number(id) },
    });
    if (!profile) {
      res.json({ msg: "no profile found" });
    }
    res.json({ msg: "success", profile });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.get("/api/posts/:id", verifyToken, async(req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const post = await prisma.posts.findUnique({
      where: { id: Number(id) },
    });
    if (!post) {
      res.json({ msg: "no profile found" });
    }
    res.json({ msg: "success", post });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.get("/api/posts", verifyToken, async(req: Request, res: Response) => {
  try {
    const posts = await prisma.posts.findMany();
    if (!posts) {
      res.json({ msg: "no profiles found" });
    }
    res.json({ msg: "success", posts });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.post("/api/create-post", verifyToken, async(req: Request, res: Response) => {
    const {title, description} = req.body;
    try {
        const post = await prisma.posts.create({
            data: {
                title, description, createdAt: ''
            }
        });
        if(!post){
            res.json({msg: 'post failed'});
        }
        res.json({msg: 'success', post: post})
    } catch (error) {
        
    }
});

app.get("/api/profiles", verifyToken, async(req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany();
    if (!profiles) {
      res.json({ msg: "no profiles found" });
    }
    res.json({ msg: "success", profiles });
  } catch (error: any) {
    res.json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log("the server is running on port " + port);
});
