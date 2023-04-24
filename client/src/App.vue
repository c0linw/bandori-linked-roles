<template>
	<div>
		<form @submit.prevent="updateAccounts">
			<input v-model="accounts.en">
			<button>Update EN account</button>
		</form>
		{{resultMsg}}
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
			},
			resultMsg: ''
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
			this.resultMsg = e.message;
		}
	},
	methods: {
		async updateAccounts() {
			try {
				const response = await axiosInstance.post("/profile/update", this.accounts);
				this.resultMsg = response.data
			} catch (e) {
				if (e.response) {
					if (e.response.status === 401) {
						window.location.href = process.env.VUE_APP_BACKEND_URL + "/login"
					}
				}
				this.resultMsg = e.message;
			}
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