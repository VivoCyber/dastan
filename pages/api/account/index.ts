import { NextApiRequest, NextApiResponse } from "next";
import { emailTokenValidator, removeCookieToken, setCookieToken, tokenCreator, tokenValidator } from "@providers/tokenProvider";
import UserPrismaProvider from "@providers/prismaProviders/userPrisma";
import zodErrorMapper, { iValidationWarnings, onErrorResponse, onNotValidResponse, onSuccessResponse } from "@providers/apiResponseHandler";
import { zUserCreate, zUserLogin, zUserUpdate } from "@models/iUser";
import { authEmailSender } from "@providers/emailService";

const userPrismaProvider = new UserPrismaProvider();
export default async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
	// identify
	if (req.method === "GET") {
		try {
			// api
			if (!req?.cookies?.token) return res.json(onSuccessResponse(false));

			// token
			const token = tokenValidator(req?.cookies?.token as string);
			if (!token) {
				removeCookieToken({ req, res });
				return res.json(onErrorResponse("bad identify request"));
			}

			// validation !
			// prisma
			const user = await userPrismaProvider.getOne(token.userId);
			if (user === "ERR") return res.json(onErrorResponse("err on identify ORM"));
			if (user === null) return res.json(onNotValidResponse([{ name: "not found", message: "not found this user" }]));

			// api
			return res.json(onSuccessResponse(user));
		} catch (error) {
			return res.json(onErrorResponse("err on identify"));
		}
	}

	// register
	else if (req.method === "POST") {
		try {
			// token
			// validation
			const validateRegister = zUserCreate.safeParse(req.body);
			if (!validateRegister.success) return res.json(zodErrorMapper(validateRegister.error.issues));

			const { email, username } = validateRegister.data;

			// prisma
			const notUnique = await userPrismaProvider.checkUniqueField({ email, username });
			if (notUnique === "ERR") return res.json(onErrorResponse("Error on register ORM"));

			// validation
			if (notUnique) {
				const validationWarnings: iValidationWarnings[] = [];
				if (email === notUnique.email) validationWarnings.push({ name: "email", message: "this email already is exist" });
				if (username === notUnique.username)
					validationWarnings.push({ name: "username", message: "this username already is exist" });

				return res.json(onNotValidResponse(validationWarnings));
			}

			// email
			const emailRes = await authEmailSender({ email: validateRegister.data.email });
			if (!emailRes) return res.json(onErrorResponse("error on sending email. please try again"));

			// prisma
			delete validateRegister.data.confirm;
			const user = await userPrismaProvider.create(validateRegister.data);
			if (user === "ERR") return res.json(onErrorResponse("Error on register ORM"));

			// api
			return res.json(onSuccessResponse("success! check your inbox for verify email"));
		} catch (error) {
			return res.json(onErrorResponse("err on register"));
		}
	}

	// login
	else if (req.method === "PUT") {
		try {
			// token !
			// validation
			const validateLogin = zUserLogin.safeParse(req.body);
			if (!validateLogin.success) return res.json(zodErrorMapper(validateLogin.error.issues));

			// prisma
			const user = await userPrismaProvider.checkEmailAuth(validateLogin.data);
			if (user === "ERR") return res.json(onErrorResponse("Error on login ORM"));
			if (user === null) return res.json(onErrorResponse("not valid login"));

			// token
			const token = tokenCreator({ userId: user.id, username: user.username, permissionLevel: user.permissionLevel, slug: user.slug });

			// api
			setCookieToken({ req, res, token });
			return res.json(onSuccessResponse(user));
		} catch (error) {
			return res.json(onErrorResponse("err on login"));
		}
	}

	// logout
	else if (req.method === "DELETE") {
		try {
			// token
			// validation!
			// prisma!
			// api

			removeCookieToken({ req, res });
			return res.json(onSuccessResponse(false));
		} catch (error) {
			return res.json(onErrorResponse("err on logout"));
		}
	}

	// update user
	if (req.method === "PATCH") {
		try {
			// token
			const token = tokenValidator(req?.cookies?.token as string);
			if (!token) {
				removeCookieToken({ req, res });
				return res.json(onErrorResponse("bad user request"));
			}

			// validation !
			const validateUpdate = zUserUpdate.safeParse(req.body);
			if (!validateUpdate.success) return res.json(zodErrorMapper(validateUpdate.error.issues));

			// prisma
			const { username } = validateUpdate.data;

			// check not repetitive
			const notUnique = await userPrismaProvider.checkUniqueField({ username, userId: token.userId });
			if (notUnique === "ERR") return res.json(onErrorResponse("Error on update ORM"));

			// on repetitive
			if (notUnique) {
				const validationWarnings: iValidationWarnings[] = [];
				if (username === notUnique.username)
					validationWarnings.push({ name: "username", message: "this username already is exist" });

				return res.json(onNotValidResponse(validationWarnings));
			}

			const body: any = {
				...validateUpdate.data,
			};

			if (validateUpdate.data.interests) {
				body.interests = { set: validateUpdate.data.interests.map((cat) => ({ id: cat.id })) };
			}

			// prisma
			const user = await userPrismaProvider.update(token.userId, body);
			if (user === "ERR") return res.json(onErrorResponse("Error on update ORM"));

			// api
			return res.json(onSuccessResponse(user));
		} catch (error) {
			return res.json(onErrorResponse("err on update user"));
		}
	}

	// not supported method
	else {
		return res.json(onErrorResponse("not supported method"));
	}
}