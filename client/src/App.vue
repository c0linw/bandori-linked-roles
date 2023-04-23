<template>
	<div>
		{{ accounts.en }}
	</div>
</template>

<script>
import axiosInstance from "./axiosInstance.js";
export default {
	name: "App",
	data() {
		return {
			accounts: {
				en: "",
				jp: ""
			}
		};
	},
	async mounted() {
		try {
			const response = await axiosInstance.get("/accounts");
			this.accounts = response.data;
		} catch (e) {
			if (e.response) {
				if (e.response.status === 401) {
					window.location.href = process.env.VUE_APP_BACKEND_URL + "/login"
				}
			}
		}
	},
	methods: {
		async updateAccount(e) {
			e.preventDefault();
			//const response = await axios.post("api/profile/update/", this.accounts);
		},
		async removeAccount() {
			// call the API to remove the account for a given server
		},
		async startAccountVerification() {
			// call the API to generate a code that the user must set in their profile description
		},
		async confirmAccountVerification() {
			// call the API to check a specified account ID
		}
	}
};
</script>

<style>

</style>