import { useRouter } from "next/router";
import useSWR from "swr";
import HTTPService from "@providers/HTTPService";
import { iPasswordUpdate, iPhone, iResetPassword, iUserCreate, iUserEmail, iUserLogin, iUserUpdate } from "@models/iUser";
import { toast } from "react-toastify";
import { errorMutateHandler, errorPurgerMutateHandler, fetchHandler, okMutateHandler } from "./useFetch";
import { staticURLs } from "statics/url";
import { apiResponse, responseState } from "@providers/apiResponseHandler";
import { userResType } from "@providers/prismaProviders/userPrisma";
import { PermissionType } from "@prisma/client";
import { permissionHasAccess } from "@providers/permissionChecker";

export function useAccount() {
	const router = useRouter();

	const {
		data: userInfo,
		error: userErr,
		isLoading,
		mutate: userMutate,
	} = useSWR("userAuth", onIdentify, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	});

	async function onIdentify() {
		try {
			const { data }: { data: apiResponse<userResType> } = await HTTPService.get(staticURLs.server.account.base);
			if (data.resState === responseState.ok) return data.data;
			else {
				throw data.errors;
			}
		} catch (error: any) {
			toast.warn("some connection error");

			throw error;
		}
	}

	function onLogin({ email, password }: iUserLogin) {
		fetchHandler<userResType>({
			fetcher: () => HTTPService.put(staticURLs.server.account.base, { email, password }),

			onOK: (data) => {
				okMutateHandler({ data, mutator: userMutate });
				router.push(staticURLs.client.home);
			},
			okMessage: "logged in",
		});
	}

	function onLogout() {
		fetchHandler({
			fetcher: () => HTTPService.delete(staticURLs.server.account.base),
			onOK: (_res) => {
				userMutate(undefined, { revalidate: false });
				window.location.replace(staticURLs.client.home);
			},

			okMessage: "logged out",
		});
	}

	async function onActiveUser({ token }: any) {
		fetchHandler<userResType>({
			fetcher: () => HTTPService.put(staticURLs.server.account.email, { token }),
			onOK: (data) => {
				okMutateHandler({ data, mutator: userMutate });
				router.push(staticURLs.client.home);
			},
		});
	}

	async function onUpdateUser(body: iUserUpdate) {
		fetchHandler<userResType>({
			fetcher: () => HTTPService.patch(staticURLs.server.account.base, body),
			onOK: (data) => {
				okMutateHandler({ data, mutator: userMutate });
				router.push(staticURLs.client.home);
			},
			onError: (error) => errorMutateHandler({ error, mutator: userMutate }),
		});
	}

	async function onRegister(body: iUserCreate) {
		fetchHandler({
			fetcher: () => HTTPService.post(staticURLs.server.account.base, body),
			onOK: () => router.push(staticURLs.client.welcome),
			onError: (error) => errorMutateHandler({ error, mutator: userMutate }),
			okMessage: "your account created. please check your email inbox for verification mail",
		});
	}

	// password
	async function onUpdatePassword(body: iPasswordUpdate) {
		fetchHandler({
			fetcher: () => HTTPService.patch(staticURLs.server.account.password, body),
		});
	}

	async function onRecoverPasswordRequest(body: iUserEmail) {
		fetchHandler({
			fetcher: () => HTTPService.post(staticURLs.server.account.password, body),
			onOK: () => router.push(staticURLs.client.home),
		});
	}

	async function onResetPassword(args: iResetPassword) {
		const body = { ...args, token: router.query.token };
		fetchHandler({
			fetcher: () => HTTPService.put(staticURLs.server.account.password, body),
			onOK: () => router.push(staticURLs.client.login),
		});
	}

	// email
	async function onResendActivationEmail(body: iUserEmail) {
		fetchHandler({
			fetcher: () => HTTPService.get(staticURLs.server.account.email, { params: body }),
			onOK: () => router.push(staticURLs.client.home),
		});
	}

	async function onRequestChangeEmail(body: iUserLogin) {
		fetchHandler({
			fetcher: () => HTTPService.post(staticURLs.server.account.email, body),
			onOK: () => router.push(staticURLs.client.checkYourEmail),
		});
	}

	async function onValidateChangeEmail({ token }: any) {
		fetchHandler<userResType>({
			fetcher: () => HTTPService.patch(staticURLs.server.account.email, { token }),
			onOK: (data) => {
				okMutateHandler({ data, mutator: userMutate });
				router.push(staticURLs.client.home);
			},
		});
	}

	// otp
	async function onSendOTP(body: iPhone) {
		fetchHandler({
			fetcher: () => HTTPService.post(staticURLs.server.account.phone, body),
			onOK: () => router.push(staticURLs.client.account.OTPCheck),
		});
	}

	async function onCheckOTP(otp: any) {
		fetchHandler<userResType>({
			fetcher: () => HTTPService.patch(staticURLs.server.account.phone, { otp }),
			onOK: (data) => {
				okMutateHandler({ data, mutator: userMutate });
				router.push(staticURLs.client.home);
			},
		});
	}

	// access
	function checkAccessAndRedirect(requirePermissionLevel = PermissionType.USER) {
		if (isLoading) return;
		if (!userInfo) return router.push(staticURLs.client.login);

		const hasAccess = permissionHasAccess({ require: requirePermissionLevel, current: userInfo?.account.permission || "GUEST" });
		if (!hasAccess) return router.push(staticURLs.client.Forbidden);
	}

	function hasAccess(requirePermissionLevel: PermissionType) {
		return permissionHasAccess({ require: requirePermissionLevel, current: userInfo?.account.permission || "GUEST" });
	}

	function onErrorPurge(errorKey: string) {
		errorPurgerMutateHandler({ errorKey, mutator: userMutate });
	}

	return {
		onLogin,
		onLogout,
		onRegister,
		onActiveUser,
		checkAccessAndRedirect,
		hasAccess,
		onUpdateUser,
		onUpdatePassword,
		onResendActivationEmail,
		onRecoverPasswordRequest,
		onResetPassword,
		onRequestChangeEmail,
		onValidateChangeEmail,
		onSendOTP,
		onCheckOTP,
		onErrorPurge,
		userInfo: userInfo,
		isLoading: isLoading,
		error: userErr,
	};
}
