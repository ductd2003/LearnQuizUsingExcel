document.getElementById('upload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Kiểm tra số dòng trong dữ liệu (trừ dòng tiêu đề)
        if (jsonData.length > 101) {  // 100 dòng dữ liệu + 1 dòng tiêu đề
            alert('File của bạn có quá 100 dòng, vui lòng kiểm tra lại.');
            return; // Không thực hiện tiếp nếu vượt quá giới hạn
        }

        generateQuiz(jsonData);
    };

    reader.readAsArrayBuffer(file);
});

function generateQuiz(data) {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = ''; // Xóa nội dung cũ

    const answersPool = data.slice(1)
        .filter(row => row[1] !== undefined && row[1].trim() !== '') // Lọc các dòng có giá trị đáp án
        .map(row => row[1]); // Tạo mảng chứa tất cả các đáp án

    data.forEach((row, index) => {
        if (index === 0) return; // Bỏ qua dòng tiêu đề
        const [question, correctAnswersStr] = row;

        // Kiểm tra nếu câu hỏi hoặc đáp án đúng bị undefined hoặc trống
        if (!question || !correctAnswersStr || correctAnswersStr.trim() === '') {
            return; // Bỏ qua hàng này nếu không có dữ liệu hợp lệ
        }

        const correctAnswers = correctAnswersStr.split(',').map(ans => ans.trim()); // Chia nhỏ đáp án đúng nếu có nhiều đáp án

        // Tạo 3 câu trả lời sai ngẫu nhiên
        let incorrectAnswers = [];
        while (incorrectAnswers.length < 3) {
            const randomAnswer = answersPool[Math.floor(Math.random() * answersPool.length)];
            if (!correctAnswers.includes(randomAnswer) && !incorrectAnswers.includes(randomAnswer)) {
                incorrectAnswers.push(randomAnswer);
            }
        }

        // Kết hợp câu trả lời đúng và sai, sau đó xáo trộn vị trí
        let allAnswers = [...incorrectAnswers, ...correctAnswers].sort(() => Math.random() - 0.5);

        // Tạo giao diện câu hỏi và câu trả lời
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = `<p>${question}</p>`;
        
        allAnswers.forEach(answer => {
            questionDiv.innerHTML += `
                <label>
                    <input type="checkbox" name="question${index}" value="${answer}" data-correct="${correctAnswers.includes(answer)}">
                    ${answer}
                </label><br>`;
        });

        quizContainer.appendChild(questionDiv);
    });
}


function submitQuiz() {
    const questions = document.querySelectorAll('#quiz-container div');
    let correctAnswersCount = 0;
    let totalQuestions = questions.length;

    questions.forEach(questionDiv => {
        const checkboxes = questionDiv.querySelectorAll('input[type="checkbox"]');
        let allCorrect = true;
        
        checkboxes.forEach(checkbox => {
            const isCorrect = checkbox.dataset.correct === "true";
            const isChecked = checkbox.checked;
            const label = checkbox.parentElement;

            // Xóa class cũ để tránh trùng lặp khi submit lại
            label.classList.remove('correct', 'incorrect');

            // Đặt class cho câu trả lời
            if (isChecked && isCorrect) {
                label.classList.add('correct'); // Câu đúng được chọn
            } else if (isChecked && !isCorrect) {
                label.classList.add('incorrect'); // Câu sai được chọn
                allCorrect = false; // Đánh dấu là có câu sai
            } else if (!isChecked && isCorrect) {
                // Nếu người dùng không chọn câu trả lời đúng, vẫn cần tô màu xanh cho câu đúng
                label.classList.add('correct');
                allCorrect = false; // Đánh dấu là có câu sai
            }
        });

        // Nếu tất cả đáp án đều đúng cho câu này
        if (allCorrect) {
            correctAnswersCount++;
        }
    });

    // Hiển thị kết quả sau khi kiểm tra
    alert(`You got ${correctAnswersCount} out of ${totalQuestions} questions correct!`);
}

