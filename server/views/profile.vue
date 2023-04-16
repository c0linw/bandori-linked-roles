<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Profile</h1>
    <p class="mb-4">Hello, {{ user.discordId }}</p>

    <form class="mb-4" @submit.prevent="submit">
      <div class="mb-2">
        <label class="block font-bold mb-2" for="gameId">Game ID</label>
        <input class="w-full px-3 py-2 border rounded" type="text" id="gameId" v-model="gameId">
      </div>

      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Save
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      gameId: "",
    };
  },
  props: ["user"],
  methods: {
    async submit() {
      try {
        const response = await fetch("/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: this.gameId }),
        });

        if (response.ok) {
          window.location.reload();
        } else {
          throw new Error("Failed to update game ID");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to update game ID");
      }
    },
  },
};
</script>