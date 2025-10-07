// ... (existing code remains unchanged above)

function generateScoresWithMinAverage(numTasks, min = 45, max = 75, minAvg = 50) {
    let scores;
    while (true) {
        scores = [];
        for (let i = 0; i < numTasks - 1; i++) {
            scores.push(Math.random() * (max - min) + min);
        }
        const sum = scores.reduce((a, b) => a + b, 0);
        const lastScore = Math.max(min, Math.min(max, minAvg * numTasks - sum));
        scores.push(lastScore);

        const avg = scores.reduce((a, b) => a + b, 0) / numTasks;
        if (avg >= minAvg && lastScore <= max && lastScore >= min) break;
    }
    return scores;
}

// ... (rest of your code remains unchanged)

class client_application {
    // ... (methods above remain unchanged)

    async do_hwks() {
        const checkboxes = document.querySelectorAll(
            ".task > input[type=checkbox]:checked",
        );
        const logs = document.getElementById("log_container");
        logs.innerHTML = `doing ${checkboxes.length} tasks...<br>`;
        const progress_bar = document.getElementById("hw_bar");
        let task_id = 1;
        let progress = 0;
        progress_bar.style.width = "0%";
        const funcs = [];
        
        // Generate random scores for selected tasks, ensure average >= 50%
        const scores = generateScoresWithMinAverage(checkboxes.length, 45, 75, 50);

        let scoreIdx = 0;
        for (const c of checkboxes) {
            const parts = c.id.split("-");
            const task = this.homeworks[parts[0]].tasks[parts[1]];
            const task_doer = new task_completer(
                this.token,
                task,
                this.homeworks[parts[0]].languageCode,
            );
            const thisScore = scores[scoreIdx++];

            funcs.push((x) =>
                (async (id, scoreOverride) => {
                    const answers = await task_doer.get_data();
                    if (answers === undefined || answers.length === 0) {
                        console.log(
                            "No answers found, skipping sending answers.",
                        );
                        return; // Stop the function if no answers are found
                    }
                    logs.innerHTML += `<b>fetched vocabs for task ${id}</b>`;
                    logs.innerHTML += `<div class="json_small">${JSON.stringify(answers)}</div>`;
                    progress += 1;
                    progress_bar.style.width = `${String((progress / checkboxes.length) * 0.5 * 100)}%`;
                    console.log("Calling send_answers with answers:", answers);

                    // Override score in data
                    const originalSendAnswers = task_doer.send_answers.bind(task_doer);
                    task_doer.send_answers = async function(vocabs) {
                        const data = {
                            moduleUid: this.catalog_uid,
                            gameUid: this.game_uid,
                            gameType: this.game_type,
                            isTest: true,
                            toietf: this.to_language,
                            fromietf: "en-US",
                            score: Math.round(scoreOverride * vocabs.length), // Use generated random score
                            correctVocabs: vocabs.map((x) => x.uid).join(","),
                            incorrectVocabs: [],
                            homeworkUid: this.homework_id,
                            isSentence: this.mode === "sentence",
                            isALevel: false,
                            isVerb: this.mode === "verbs",
                            verbUid: this.mode === "verbs" ? this.catalog_uid : "",
                            phonicUid: this.mode === "phonics" ? this.catalog_uid : "",
                            sentenceScreenUid: this.mode === "sentence" ? 100 : "",
                            sentenceCatalogUid:
                                this.mode === "sentence" ? this.catalog_uid : "",
                            grammarCatalogUid: this.catalog_uid,
                            isGrammar: false,
                            isExam: this.mode === "exam",
                            correctStudentAns: "",
                            incorrectStudentAns: "",
                            timeStamp:
                                Math.floor(speed + ((Math.random() - 0.5) / 10) * speed) * 1000,
                            vocabNumber: vocabs.length,
                            rel_module_uid: this.task.rel_module_uid,
                            dontStoreStats: true,
                            product: "secondary",
                            token: this.token,
                        };
                        console.log(data);
                        const response = await this.call_lnut(
                            "gameDataController/addGameScore",
                            data,
                        );
                        return response;
                    };

                    const result = await task_doer.send_answers(answers);
                    logs.innerHTML += `<b>task ${id} done, scored ${result.score}</b>`;
                    logs.innerHTML += `<div class="json_small">${JSON.stringify(result)}</div>`;
                    logs.scrollTop = logs.scrollHeight;
                    progress += 1;
                    progress_bar.style.width = `${String((progress / checkboxes.length) * 0.5 * 100)}%`;
                })(task_id++, thisScore),
            );
        }
        asyncPool(funcs, 5).then(() => {
            this.display_hwks();
        });
    }

    // ... (rest of your code remains unchanged)
}

// ... (app setup and main call as before)
