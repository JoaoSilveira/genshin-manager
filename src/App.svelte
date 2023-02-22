<script lang="ts">
	import genshin_data from "../data_test/genshin_data.json";
	import Button from "./components/Button.svelte";
	import Icon from "./components/Icon.svelte";

	type TierObject = {
		low: number;
		medium: number;
		high: number;
		highest?: number;
	};

	type TierCost = {
		quantity: number;
		tier: keyof TierObject;
	};

	type LevelCap = {
		level: number;
		cap: number;
	};

	type TalentProgress = {
		start: number;
		end: number;
	};

	type LevelCapIndex = LevelCap;

	function formatNumber(value: number): string {
		const text = value.toString();
		const offset = text.length % 3;
		let output = text.substring(0, offset) + " ";

		for (let i = offset; i < text.length; i += 3) {
			output += text.substring(i, i + 3) + " ";
		}

		return output.substring(0, output.length - 1);
	}

	class MaterialCost {
		materials: { id: number; quantity: number }[] = [];

		addTiered(tiers: TierObject, cost: TierCost) {
			const id = tiers[cost.tier];

			if (id == null) {
				console.debug(tiers, cost.tier);
				throw new Error("No id for the requested tier");
			}

			const material = this.materials.find((m) => m.id === id);
			if (material) {
				material.quantity += cost.quantity;
			} else {
				this.materials.push({ id, quantity: cost.quantity });
			}

			return this;
		}

		addSimple(id: number, quantity: number) {
			const material = this.materials.find((m) => m.id === id);
			if (material) {
				material.quantity += quantity;
			} else {
				this.materials.push({ id, quantity });
			}

			return this;
		}

		addItem(item: { id: number; quantity: number }) {
			const material = this.materials.find((m) => m.id === item.id);
			if (material) {
				material.quantity += item.quantity;
			} else {
				this.materials.push({ ...item });
			}

			return this;
		}

		merge(other: MaterialCost) {
			for (const other_mat of other.materials) {
				const mat = this.materials.find((m) => other_mat.id === m.id);

				if (mat) {
					mat.quantity += other_mat.quantity;
				} else {
					this.materials.push({ ...other_mat });
				}
			}

			return this;
		}

		toItemList() {
			const items = new Array(this.materials.length);
			for (let i = 0; i < this.materials.length; i++) {
				const mat = this.materials[i];
				const item = genshin_data.items.find((i) => i.id === mat.id);

				if (item == null)
					throw new Error("Could not find item by the id " + mat.id);
				items[i] = { ...item, quantity: mat.quantity };
			}

			return items;
		}
	}

	function toggleAccordion() {
		this.classList.toggle("open");
		this.nextElementSibling?.classList.toggle("open");
	}

	function extractTalentProgress(text: string): TalentProgress {
		const parts = text.split("/");

		if (parts.length != 2) throw new Error("Invalid level/cap format");

		const start = Number.parseInt(parts[0]);
		const end = Number.parseInt(parts[1]);

		if (start < 1 || start > 10)
			throw new Error("Invalid talent start value");
		if (end < 1 || end > 10 || end < start)
			throw new Error("Invalid talent end value");

		return { start, end };
	}

	function extractLevelAndCap(text: string): LevelCap {
		const parts = text.split("/");

		if (parts.length != 2) throw new Error("Invalid level/cap format");

		const level = Number.parseInt(parts[0]);
		const cap = Number.parseInt(parts[1]);

		if (Number.isNaN(level) || Number.isNaN(cap))
			throw new Error("Invalid number for level/cap");

		const cap_index = genshin_data.levelBarriers.findIndex(
			(lb) => lb === cap
		);

		if (cap_index < 0) throw new Error(`${cap} is not a valid level cap`);

		if (
			level > cap ||
			level <
				(cap_index > 0 ? genshin_data.levelBarriers[cap_index - 1] : 1)
		)
			throw new Error("Level is not in a valid cap range");

		return { level, cap };
	}

	function extractLevelAndCapIndex(text: string): LevelCapIndex {
		const level_cap = extractLevelAndCap(text);
		level_cap.cap = genshin_data.levelBarriers.findIndex(
			(lb) => lb === level_cap.cap
		);

		return level_cap;
	}

	function findWeaponMat(material_ids: {
		weaponMaterial: number;
		eliteMaterial: number;
		commonMaterial: number;
	}): {
		wam: any;
		elite: any;
		common: any;
	} {
		const weapon_mat = genshin_data.items.find(
			(i) => i.id === material_ids.weaponMaterial
		);
		const elite_mat = genshin_data.items.find(
			(i) => i.id === material_ids.eliteMaterial
		);
		const common_mat = genshin_data.items.find(
			(i) => i.id === material_ids.commonMaterial
		);

		if (!(weapon_mat && elite_mat && common_mat))
			throw new Error("Invalid weapon ascension material data");

		return {
			wam: weapon_mat.tiers,
			elite: elite_mat.tiers,
			common: common_mat.tiers,
		};
	}

	function findCharacterAscensionMat(material_ids: {
		gemGroup: number;
		monsterGroup: number;
	}): {
		gem: any;
		common: any;
	} {
		const gem = genshin_data.items.find(
			(i) => i.id === material_ids.gemGroup
		);
		const common = genshin_data.items.find(
			(i) => i.id === material_ids.monsterGroup
		);

		if (!(gem && common))
			throw new Error("Invalid character ascension material data");

		return {
			gem: gem.tiers,
			common: common.tiers,
		};
	}

	function findCharacterTalentMat(material_ids: {
		bookSeries: number;
		monsterGroup: number;
	}): {
		book: any;
		common: any;
	} {
		const book = genshin_data.items.find(
			(i) => i.id === material_ids.bookSeries
		);
		const common = genshin_data.items.find(
			(i) => i.id === material_ids.monsterGroup
		);

		if (!(book && common))
			throw new Error("Invalid character ascension material data");

		return {
			book: book.tiers,
			common: common.tiers,
		};
	}

	function weaponCost(config: { name: string; start: string; end: string }) {
		const weapon = genshin_data.weapon.list.find(
			(w) => w.name === config.name
		);

		if (weapon == null)
			throw new Error(
				`Weapon named '${config.name}' does not exist in the database`
			);

		try {
			const star_index = weapon.stars - 1;
			const material = findWeaponMat(weapon.ascension);
			const start = extractLevelAndCapIndex(config.start);
			const end = extractLevelAndCapIndex(config.end);
			const ascension_cost = genshin_data.weapon.ascension[
				star_index
			].slice(start.cap, end.cap);

			return {
				mora: ascension_cost
					.map((ac) => ac.mora)
					.reduce((sum, mora) => sum + mora, 0),
				experience: genshin_data.weapon.exp[star_index]
					.slice(start.level - 1, end.level - 1)
					.reduce((sum, val) => sum + val, 0),
				wam: ascension_cost
					.map((ac) => ac.weaponMaterial as TierCost)
					.reduce(
						(mc, asc) => mc.addTiered(material.wam, asc),
						new MaterialCost()
					),
				common: ascension_cost
					.map((ac) => ac.monsterMaterial as TierCost)
					.reduce(
						(mc, asc) => mc.addTiered(material.common, asc),
						new MaterialCost()
					),
				elite: ascension_cost
					.map((ac) => ac.eliteMaterial as TierCost)
					.reduce(
						(mc, asc) => mc.addTiered(material.elite, asc),
						new MaterialCost()
					),
			};
		} catch (cause) {
			throw new Error("Weapon: " + config.name, { cause });
		}
	}

	function characterAscensionCost(
		character,
		config: {
			level_start: string;
			level_end: string;
		}
	) {
		try {
			const start = extractLevelAndCapIndex(config.level_start);
			const end = extractLevelAndCapIndex(config.level_end);
			const material = findCharacterAscensionMat(character.ascension);
			const ascension_cost = genshin_data.character.ascension.slice(
				start.cap,
				end.cap
			);

			return {
				mora: ascension_cost
					.map((ac) => ac.mora)
					.reduce((sum, mora) => sum + mora, 0),
				experience: genshin_data.character.exp
					.slice(start.level - 1, end.level - 1)
					.reduce((sum, val) => sum + val, 0),
				gem: ascension_cost
					.map((ac) => ac.gem as TierCost)
					.reduce(
						(mc, asc) => mc.addTiered(material.gem, asc),
						new MaterialCost()
					),
				common: ascension_cost
					.map((ac) => ac.monsterMaterial as TierCost)
					.reduce(
						(mc, asc) => mc.addTiered(material.common, asc),
						new MaterialCost()
					),
				local_specialty: {
					id: character.ascension.localSpecialty,
					quantity: ascension_cost
						.map((ac) => ac.localSpecialty)
						.reduce((sum, ls) => sum + ls, 0),
				},
				boss: {
					id: character.ascension.bossMaterial,
					quantity: ascension_cost
						.map((ac) => ac.bossMaterial)
						.filter((m) => m != null)
						.reduce((sum, ls) => sum + ls, 0),
				},
			};
		} catch (cause) {
			throw new Error(`Character: ${character.name}. ${cause.message}`);
		}
	}

	function characterTalentCost(
		character,
		conf: {
			basic_talent: string;
			elemental_talent: string;
			burst_talent: string;
		}
	) {
		const normal = extractTalentProgress(conf.basic_talent);
		const elemental = extractTalentProgress(conf.elemental_talent);
		const burst = extractTalentProgress(conf.burst_talent);
		const material = findCharacterTalentMat(character.talentAscension);

		function regular(progress: TalentProgress) {
			const cost = genshin_data.character.talent.slice(
				progress.start - 1,
				progress.end - 1
			);

			return {
				mora: cost
					.map((ac) => ac.mora)
					.reduce((sum, mora) => sum + mora, 0),
				common: cost
					.map((ac) => ac.monsterMaterial as TierCost)
					.reduce(
						(mc, m) => mc.addTiered(material.common, m),
						new MaterialCost()
					),
				book: cost
					.map((ac) => ac.book as TierCost)
					.reduce(
						(mc, b) => mc.addTiered(material.book, b),
						new MaterialCost()
					),
				boss: cost
					.map((ac) => ac.bossMaterial)
					.filter((m) => m != null)
					.reduce((sum, b) => sum + b, 0),
				crown: cost
					.map((ac) => ac.crown)
					.filter((m) => m != null)
					.reduce((sum, crown) => sum + crown, 0),
			};
		}

		const normal_cost = regular(normal);
		const elemental_cost = regular(elemental);
		const burst_cost = regular(burst);

		return {
			mora: normal_cost.mora + elemental_cost.mora + burst_cost.mora,
			common: normal_cost.common
				.merge(elemental_cost.common)
				.merge(burst_cost.common),
			book: normal_cost.book
				.merge(elemental_cost.book)
				.merge(burst_cost.book),
			boss: new MaterialCost().addItem({
				id: character.talentAscension.bossMaterial,
				quantity:
					normal_cost.boss + elemental_cost.boss + burst_cost.boss,
			}),
			crown: normal_cost.crown + elemental_cost.crown + burst_cost.crown,
		};
	}

	function travelerTalentCost(
		character,
		conf_by_element: {
			[prop: string]: {
				basic_talent: string;
				elemental_talent: string;
				burst_talent: string;
			};
		}
	) {
		const cost = {
			mora: 0,
			common: new MaterialCost(),
			book: new MaterialCost(),
			boss: new MaterialCost(),
			crown: 0,
		};

		function regular(progress: TalentProgress, material_by_level: any[]) {
			const mats = material_by_level.slice(
				progress.start - 1,
				progress.end - 1
			);
			const costs = genshin_data.character.talent.slice(
				progress.start - 1,
				progress.end - 1
			);

			for (let i = 0; i < costs.length; i++) {
				cost.mora += costs[i].mora;
				cost.common.addSimple(
					mats[i].monster,
					costs[i].monsterMaterial.quantity
				);
				cost.book.addSimple(mats[i].book, costs[i].book.quantity);
				cost.crown += costs[i].crown ?? 0;

				if ("boss" in mats[i]) {
					cost.boss.addSimple(mats[i].boss, costs[i].bossMaterial);
				}
			}
		}

		for (const [element, conf] of Object.entries(conf_by_element)) {
			const normal = extractTalentProgress(conf.basic_talent);
			const elemental = extractTalentProgress(conf.elemental_talent);
			const burst = extractTalentProgress(conf.burst_talent);

			if (!(element in character.talentAscension))
				throw new Error(
					`No talent build information for element ${element}`
				);

			if (Array.isArray(character.talentAscension[element])) {
				regular(normal, character.talentAscension[element]);
				regular(elemental, character.talentAscension[element]);
				regular(burst, character.talentAscension[element]);
			} else {
				regular(
					normal,
					character.talentAscension[element]["normal attack"]
				);
				regular(
					elemental,
					character.talentAscension[element][
						"elemental skill or burst"
					]
				);
				regular(
					burst,
					character.talentAscension[element][
						"elemental skill or burst"
					]
				);
			}
		}

		return cost;
	}

	function characterCost(conf) {
		const character = genshin_data.character.list.find(
			(w) => w.name === conf.name
		);

		if (character == null)
			throw new Error(
				`Character named '${conf.name}' does not exist in the database`
			);

		const ascension_cost = characterAscensionCost(character, conf);
		const talent_cost =
			character.name === "Traveler"
				? travelerTalentCost(character, conf)
				: characterTalentCost(character, conf);

		return {
			mora: ascension_cost.mora + talent_cost.mora,
			experience: ascension_cost.experience,
			common: ascension_cost.common.merge(talent_cost.common),
			gem: ascension_cost.gem,
			book: talent_cost.book,
			local_specialty: ascension_cost.local_specialty,
			ascension_boss: ascension_cost.boss,
			talent_boss: talent_cost.boss,
			crown: talent_cost.crown,
		};
	}

	function calculateCost(build_conf) {
		const cost = {
			mora: 0,
			character_experience: 0,
			weapon_experience: 0,
			common: new MaterialCost(),
			elite: new MaterialCost(),
			gem: new MaterialCost(),
			book: new MaterialCost(),
			wam: new MaterialCost(),
			local_specialty: new MaterialCost(),
			ascension_boss: new MaterialCost(),
			talent_boss: new MaterialCost(),
			crown: 0,
		};

		for (const char_conf of build_conf.char_build) {
			const char_cost = characterCost(char_conf);

			cost.mora += char_cost.mora;
			cost.character_experience += char_cost.experience;
			cost.common.merge(char_cost.common);
			cost.gem.merge(char_cost.gem);
			cost.book.merge(char_cost.book);
			cost.local_specialty.addItem(char_cost.local_specialty);
			cost.ascension_boss.addItem(char_cost.ascension_boss);
			cost.talent_boss.merge(char_cost.talent_boss);
			cost.crown += char_cost.crown;
		}

		for (const weap_conf of build_conf.weap_build) {
			const weap_cost = weaponCost(weap_conf);

			cost.mora += weap_cost.mora;
			cost.weapon_experience += weap_cost.experience;
			cost.common.merge(weap_cost.common);
			cost.wam.merge(weap_cost.wam);
			cost.elite.merge(weap_cost.elite);
		}

		return {
			mora: cost.mora,
			character_experience: cost.character_experience,
			weapon_experience: cost.weapon_experience,
			common: cost.common
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			elite: cost.elite
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			gem: cost.gem
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			book: cost.book
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			wam: cost.wam
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			local_specialty: cost.local_specialty
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			ascension_boss: cost.ascension_boss
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			talent_boss: cost.talent_boss
				.toItemList()
				.filter((i) => i.quantity > 0)
				.sort((a, b) => a.id - b.id),
			crown: cost.crown,
		};
	}

	function readStoredIndex() {
		const stored = localStorage.getItem("selected_build_index");
		if (stored == null) return null;

		const index = parseInt(stored);
		console.log("Reading stored index", index);
		return Number.isNaN(index) ? null : index;
	}

	let party_modal: HTMLDialogElement;
	let selection_modal: HTMLDialogElement;
	let weapon_modal: HTMLDialogElement;
	let character_modal: HTMLDialogElement;
	let build_config = JSON.parse(localStorage.getItem("build_config") ?? "[]");
	let build_index = readStoredIndex();
	let editing_build = { description: "", thumbnail: "", thumbnail_name: "" };
	let editing_char = {
		id: null,
		name: "",
		image: "",
		level_start: "",
		level_end: "",
		basic_talent: "",
		elemental_talent: "",
		burst_talent: "",
	};
	let editing_weap = { id: null, name: "", image: "", start: "", end: "" };

	$: selected_build =
		build_index != null &&
		build_index >= 0 &&
		build_index < build_config.length
			? build_config[build_index]
			: null;
	$: build_cost =
		selected_build != null ? calculateCost(selected_build) : null;
	$: {
		console.debug("updating build_index", build_index);

		if (build_index != null) {
			localStorage.setItem(
				"selected_build_index",
				build_index.toString()
			);
		} else {
			localStorage.removeItem("selected_build_index");
		}
	}
	$: {
		console.debug("updating build_config", build_config);
		localStorage.setItem("build_config", JSON.stringify(build_config));
	}
</script>

<div class="content">
	<nav>
		<Button on:click={() => selection_modal.showModal()} icon>
			<Icon icon="menu-hamburger" size="30px" stroke="inherit" />
		</Button>

		<div class="build-thumbnail">
			{#if selected_build != null}
				<img
					src={selected_build.thumbnail}
					alt={selected_build.thumbnail_name} />
			{:else}
				<Icon icon="user-question" />
			{/if}
		</div>

		{#if selected_build != null}
			<h1 class="description">{selected_build.description}</h1>

			<Button
				icon
				on:click={() => {
					editing_build.description = selected_build.description;
					editing_build.thumbnail = selected_build.thumbnail;
					editing_build.thumbnail_name =
						selected_build.thumbnail_name;

					party_modal.showModal();
				}}>
				<Icon icon="edit-4" size="30px" />
			</Button>
		{:else}
			<h1 class="description">Access menu to select or create build</h1>
		{/if}
	</nav>

	{#if selected_build != null}
		<section class="accordion">
			<div class="header" on:click={toggleAccordion} class:open={false}>
				Characters
			</div>

			<div class="body icon-grid" class:open={false}>
				<button
					on:click={() => {
						const char = genshin_data.character.list.find(
							(c1) =>
								!selected_build.char_build.some(
									(c2) => c1.name === c2.name
								)
						);

						editing_char.id = null;
						editing_char.image = char.image;
						editing_char.name = char.name;
						editing_char.level_start = "";
						editing_char.level_end = "";
						editing_char.basic_talent = "";
						editing_char.elemental_talent = "";
						editing_char.burst_talent = "";

						character_modal.showModal();
					}}>Add</button>

				{#each selected_build.char_build as character}
					<div
						class="icon"
						on:click={() => {
							editing_char = { ...character };

							character_modal.showModal();
						}}>
						<img src={character.image} alt={character.name} />
					</div>
				{/each}
			</div>

			<div class="header" on:click={toggleAccordion} class:open={false}>
				Weapons
			</div>
			<div class="body icon-grid" class:open={false}>
				<button
					on:click={() => {
						const weapon = genshin_data.weapon.list[0];

						editing_weap.id = null;
						editing_weap.image = weapon.image;
						editing_weap.name = weapon.name;
						editing_weap.start = "";
						editing_weap.end = "";

						weapon_modal.showModal();
					}}>Add</button>
				{#each selected_build.weap_build as weapon}
					<img
						src={weapon.image}
						alt={weapon.name}
						on:click={() => {
							editing_weap = { ...weapon };

							weapon_modal.showModal();
						}} />
				{/each}
			</div>
		</section>

		<section id="cost-panel">
			<p>
				Mora: {formatNumber(
					build_cost.mora +
						Math.ceil(build_cost.character_experience / 5) +
						Math.ceil(build_cost.weapon_experience / 10)
				)}
			</p>
			<p>
				Character Experience: {formatNumber(
					build_cost.character_experience
				)} -> {Math.ceil(build_cost.character_experience / 20000)}
			</p>
			<p>
				Weapon Experience: {formatNumber(build_cost.weapon_experience)} ->
				{Math.ceil(build_cost.weapon_experience / 10000)}
			</p>
			<p>Crowns: {build_cost.crown}</p>

			<h1>Common Loot</h1>
			<div class="icon-grid">
				{#each build_cost.common as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Elite Loot</h1>
			<div class="icon-grid">
				{#each build_cost.elite as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Gems</h1>
			<div class="icon-grid">
				{#each build_cost.gem as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Talent Books</h1>
			<div class="icon-grid">
				{#each build_cost.book as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Weapon Ascension Material</h1>
			<div class="icon-grid">
				{#each build_cost.wam as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Local Specialty</h1>
			<div class="icon-grid">
				{#each build_cost.local_specialty as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Ascension Bosses</h1>
			<div class="icon-grid">
				{#each build_cost.ascension_boss as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>

			<h1>Talent Bosses</h1>
			<div class="icon-grid">
				{#each build_cost.talent_boss as item}
					<div>
						<img src={item.image} alt={item.name} />
						<span>{item.quantity}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<dialog bind:this={party_modal}>
	<form
		method="dialog"
		on:submit={() => {
			if (selected_build == null) {
				build_index =
					build_config.push({
						...editing_build,
						char_build: [],
						weap_build: [],
					}) - 1;
			} else {
				selected_build.description = editing_build.description;
				selected_build.thumbnail = editing_build.thumbnail;
				selected_build.thumbnail_name = editing_build.thumbnail_name;
			}

			build_config = [...build_config];
		}}>
		<input
			type="text"
			name="description"
			bind:value={editing_build.description} />

		<img src={editing_build.thumbnail} alt={editing_build.thumbnail_name} />

		<div class="horizontal-list">
			{#each genshin_data.character.list as character}
				<img
					src={character.image}
					alt={character.name}
					class:active={character.name ===
						editing_build.thumbnail_name}
					on:click={() => {
						editing_build.thumbnail = character.image;
						editing_build.thumbnail_name = character.name;
					}} />
			{/each}
		</div>

		<input type="submit" value="Submit" />
		<input
			type="button"
			value="Cancel"
			on:click={() => party_modal.close()} />
	</form>
</dialog>

<dialog bind:this={selection_modal}>
	<button
		on:click={() => {
			build_index = null;
			selection_modal.close();
		}}>Clear Selection</button>

	<div>
		{#each build_config as build, i}
			<div
				on:click={() => {
					build_index = i;
					selection_modal.close();
				}}>
				<img src={build.thumbnail} alt={build.thumbnail_name} />
				<p>{build.description}</p>
			</div>
		{/each}
	</div>
</dialog>

{#if selected_build != null}
	<dialog bind:this={character_modal}>
		<form
			method="dialog"
			on:submit={() => {
				const index = selected_build.char_build.findIndex(
					(w) => w.id === editing_char.id
				);

				if (index >= 0) {
					const build = selected_build.char_build[index];
					build.image = editing_char.image;
					build.name = editing_char.name;
					build.level_start = editing_char.level_start;
					build.level_end = editing_char.level_end;
					build.basic_talent = editing_char.basic_talent;
					build.elemental_talent = editing_char.elemental_talent;
					build.burst_talent = editing_char.burst_talent;
				} else {
					const build = { ...editing_char };
					const len = selected_build.char_build.push(build);

					if (len === 1) {
						build.id = 0;
					} else {
						build.id = selected_build.char_build[len - 2].id + 1;
					}
				}

				selected_build.char_build = [...selected_build.char_build];
				build_config = [...build_config];
			}}>
			<img src={editing_char.image} alt={editing_char.name} />

			<div class="horizontal-list">
				{#each genshin_data.character.list.filter((c1) => !selected_build.char_build.some((c2) => c1.name === c2.name)) as character}
					<img
						src={character.image}
						alt={character.name}
						on:click={() => {
							editing_char.image = character.image;
							editing_char.name = character.name;
						}} />
				{/each}
			</div>

			<input
				type="text"
				name="level_start"
				bind:value={editing_char.level_start} />
			<input
				type="text"
				name="level_end"
				bind:value={editing_char.level_end} />
			<input
				type="text"
				name="basic_talent"
				bind:value={editing_char.basic_talent} />
			<input
				type="text"
				name="elemental_talent"
				bind:value={editing_char.elemental_talent} />
			<input
				type="text"
				name="burst_talent"
				bind:value={editing_char.burst_talent} />

			{#if editing_char.id != null}
				<input
					type="button"
					value="Delete"
					on:click={() => {
						const index = selected_build.char_build.findIndex(
							(w) => w.id === editing_char.id
						);

						if (index >= 0) {
							selected_build.char_build.splice(index, 1);
							selected_build.char_build = [
								...selected_build.char_build,
							];
						}

						build_config = [...build_config];
						character_modal.close();
					}} />
			{/if}
			<input type="submit" value="Submit" />
			<input
				type="button"
				value="Cancel"
				on:click={() => character_modal.close()} />
		</form>
	</dialog>

	<dialog bind:this={weapon_modal}>
		<form
			method="dialog"
			on:submit={() => {
				const index = selected_build.weap_build.findIndex(
					(w) => w.id === editing_weap.id
				);

				if (index >= 0) {
					const build = selected_build.weap_build[index];
					build.image = editing_weap.image;
					build.name = editing_weap.name;
					build.start = editing_weap.start;
					build.end = editing_weap.end;
				} else {
					const build = { ...editing_weap };
					const len = selected_build.weap_build.push(build);

					if (len === 1) {
						build.id = 0;
					} else {
						build.id = selected_build.weap_build[len - 2].id + 1;
					}
				}

				selected_build.weap_build = [...selected_build.weap_build];
				build_config = [...build_config];
			}}>
			<img src={editing_weap.image} alt={editing_weap.name} />
			<div class="horizontal-list">
				{#each genshin_data.weapon.list as weapon}
					<img
						src={weapon.image}
						alt={weapon.name}
						on:click={() => {
							editing_weap.image = weapon.image;
							editing_weap.name = weapon.name;
						}} />
				{/each}
			</div>
			<input type="text" name="start" bind:value={editing_weap.start} />
			<input type="text" name="end" bind:value={editing_weap.end} />

			{#if editing_weap.id != null}
				<input
					type="button"
					value="Delete"
					on:click={() => {
						const index = selected_build.weap_build.findIndex(
							(w) => w.id === editing_weap.id
						);

						if (index >= 0) {
							selected_build.weap_build.splice(index, 1);
							selected_build.weap_build = [
								...selected_build.weap_build,
							];
						}

						build_config = [...build_config];
						weapon_modal.close();
					}} />
			{/if}
			<input type="submit" value="Submit" />
			<input
				type="button"
				value="Cancel"
				on:click={() => weapon_modal.close()} />
		</form>
	</dialog>
{/if}

<!-- <script lang="ts">
	import BuildCost from "./components/BuildCost.svelte";
	import CharacterList from "./components/CharacterList.svelte";
	import PartyList from "./components/PartyList/PartyList.svelte";
	import PartyPresentation from "./components/PartyPresentation.svelte";
	import { activeParty } from "./stores/party";
</script>

<main>
	<!-- <PartyList />

	{#if $activeParty != null}
		<PartyPresentation />
	{/if}

	<hr /> -- >
	<BuildCost />
	<hr />
	<CharacterList />
</main>

<style lang="scss">
	main {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
	}

	hr {
		border-color: #ddd;
		opacity: 0.25;
	}
</style> -->

<svelte:head>
	<style lang="scss">
		@import "./scss/global";
	</style>
</svelte:head>

<style lang="scss">
	div.content {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: auto 1fr;
		flex-wrap: wrap;
		height: 100%;
		column-gap: 2rem;

		nav {
			grid-column: 1 / span 2;
		}

		section {
			flex: 1;
			overflow-y: auto;
		}
	}

	.accordion {
		display: flex;
		flex-direction: column;

		& > .header {
			flex: 0 0;
			border-bottom: 2px solid black;

			&.open {
				border-bottom-color: red;
			}
		}

		& > .body {
			flex: 0 0;
			height: 0;
			overflow: hidden;
			transition: flex-grow 125ms;

			&.open {
				flex-grow: 1;
				min-height: 20%;
			}
		}
	}

	.icon-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: flex-start;
		align-content: flex-start;

		& > * {
			width: 50px;
			height: 50px;
		}
	}

	.icon > img {
		width: 100%;
		height: 100;
	}

	.horizontal-list {
		display: flex;
		overflow-x: auto;
		gap: 0.5rem;
	}

	#cost-panel .icon-grid > div {
		width: 50px;
		height: auto;
		display: flex;
		flex-direction: column;
		align-items: center;

		& > img {
			width: 100%;
		}
	}

	nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 1rem;
		border-bottom: 2px solid var(--border-color);

		& > .build-thumbnail {
			width: 60px;
			height: 60px;

			& > img {
				width: 100%;
				height: 100%;
			}
		}

		& > .description {
			flex: 1;
			line-height: 1;
		}
	}
</style>
