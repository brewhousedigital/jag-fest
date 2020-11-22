if(document.getElementById("ranking-choice-1") !== null) {
	let rankChoice1 = document.getElementById("ranking-choice-1");
	let rankChoice2 = document.getElementById("ranking-choice-2");

	let rankCompare1 = document.getElementById("ranking-compare-1");
	let rankCompare2 = document.getElementById("ranking-compare-2");

	function rankComparisonUpdate(person, targetEl) {
		targetEl.classList.remove("ranking-compare-loaded");

		setTimeout(function() {
			fetch('/js/ranking.json')
				.then(response => response.json())
				.then(function(data) {
					let players = data;

					players.forEach(function(player) {
						if(player.id === parseInt(person)) {
							console.log(player);

							let badge = targetEl.querySelector(".ranking-badge");
							let avatar = targetEl.querySelector(".circle");
							let name = targetEl.querySelector(".ribbon");
							let games = targetEl.querySelector(".list-group");

							badge.className = "";
							badge.classList.add("ranking-badge", "ranking-" + player.color);
							avatar.style.backgroundImage = "url('/images/avatars/" + player.avatar + "')";
							name.innerText = player.name;

							let gameList = player.games;
							games.innerHTML = "";

							gameList.forEach(function(game) {
								let html = `
								<li class="list-group-item d-flex justify-content-between align-items-center bg-dark">
									<div>${game.name}</div>
									<div>
										<span class="badge bg-success rounded-pill">${game.wins}</span>
										<span class="badge bg-danger rounded-pill">${game.loses}</span>
									</div>
								</li>
								`;
								games.insertAdjacentHTML("beforeend", html);
							})

							targetEl.classList.add("ranking-compare-loaded");
						}
					});
				});
		}, 300)
	}

	rankChoice1.addEventListener("change", function() {
		rankComparisonUpdate(this.value, rankCompare1);
	});

	rankChoice2.addEventListener("change", function() {
		rankComparisonUpdate(this.value, rankCompare2);
	});
}
