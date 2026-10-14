import jwt from 'jsonwebtoken';

export default function authUser(req,res,next) {

    const header = req.header('Authorization');

    if (!header) {
        return res.status(401).json({error:'Authorization Header Missing'});
    }

    const token = header.split(' '); //Bearer [0] (my_token) [1]

    if (token[0] !== "Bearer" || !token[1]) {
        return res.status(401).json({
            error: "Invalid authorization format"
        });
    }
    try {
        const auth = jwt.verify(token[1],process.env.JWT_SECRET);

        req.usuario = auth;
        next();
    }catch(error) {
        console.log(error.message);
        return res.status(401).json("Authentication denied!");
    }

}