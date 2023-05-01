import HTTPService from "@providers/HTTPService";
import { responseState } from "@providers/apiResponseHandler";
import { paramGenerator } from "@utilities/paramGenerator";
import { toast } from "react-toastify";
import useSWR from "swr";

export function useProfileImageParam() {
	const { data: profileImageParam, mutate: imgParamMutate } = useSWR("forceChangeImageParam", paramGenerator, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	});

	async function onUpdateProfileImage({ formData }: { formData: FormData }) {
		try {
			const { data } = await HTTPService.post("/account/image", formData);
			if (data.resState === responseState.ok) {
				imgParamMutate(paramGenerator, {
					populateCache(result, _) {
						return result;
					},
					revalidate: false,
				});
				return toast.success("image uploaded.");
			} else {
				return toast.warn("image upload failed!");
			}
		} catch (error) {
			return toast.warn("image upload failed!");
		}
	}

	return { onUpdateProfileImage, profileImageParam };
}
