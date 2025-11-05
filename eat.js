// 确保在 DOM 加载完毕后执行
document.addEventListener('DOMContentLoaded', () => {

    /*
     * ========================================
     * 数据定义 (Data)
     * ========================================
     */
    const dailyOptions = [
        { name: "沙县小吃", price: "15-20", location: "印象城负一楼" },
        { name: "猪脚饭", price: "18-21", location: "印象城负一楼" },
        { name: "米多利", price: "18-25", location: "印象城负一楼" },
        { name: "摔浇锅锅", price: "13-18", location: "印象城负一楼" },
        { name: "素椒面", price: "13-18", location: "印象城负一楼" },
        { name: "老钟家", price: "15-25", location: "印象城负一楼" },
        { name: "KFC", price: "30-40", location: "印象城一楼" },
        { name: "张亮麻辣烫", price: "20-30", location: "小吃街" },
        { name: "食堂", price: "10-15", location: "风华&阳光" },
        { name: "刀马旦板凳面", price: "15-20", location: "印象城负一楼" },
        { name: "醉湘楼", price: "25-30", location: "SM广场旁" },
    ];

    const fancyOptions = [
        { name: "吉布鲁", price: "75/人", location: "印象城5楼" },
        { name: "姜胖胖烤肉", price: "60/人", location: "印象城4楼" },
        { name: "盼大喵自助火锅", price: "60/人", location: "印象城4楼" },
        { name: "烤匠", price: "80-90/人", location: "印象城4楼" },
        { name: "守柴炉烤鸭", price: "60/人", location: "印象城5楼" },
        { name: "汉巴味德", price: "90/人", location: "印象城5楼" },
        { name: "袁记串串香", price: "80-90/人", location: "熊猫电视塔旁" },
        { name: "陶德砂锅", price: "60-70/人", location: "伊藤洋华堂斜对面" },
        { name: "有红鸡毛店", price: "50-65/人", location: "财富又一城" },
        { name: "三禾江湖川菜", price: "¥50-60/人", location: "财富又一城旁" },
        { name: "烧烤", price: "¥70-80/人", location: "醉湘楼旁边" },
    ];

    // 用于绘制扇形的颜色
    const sliceColors = [
        "#ffc0cb", "#add8e6", "#90ee90", "#fffacd", "#ffb6c1",
        "#e6e6fa", "#f0e68c", "#dda0dd", "#b0e0e6", "#ffa07a"
    ];

    let currentOptions = []; // 当前转盘的选项
    let currentRotation = 0; // 当前转盘的旋转角度
    let isSpinning = false; // 是否正在旋转

    /*
     * ========================================
     * DOM 元素获取 (Elements)
     * ========================================
     */
    const mainContainer = document.querySelector('.main-container');
    const choiceScreen = document.getElementById('choice-screen');
    const wheelScreen = document.getElementById('wheel-screen');

    const btnDaily = document.querySelector('.btn-daily');
    const btnFancy = document.querySelector('.btn-fancy');
    const backBtn = document.getElementById('back-btn');
    const spinBtn = document.getElementById('spin-btn');
    const pointer = document.querySelector('.pointer');

    // Canvas
    const wheelCanvas = document.getElementById('wheel-canvas');
    const ctx = wheelCanvas.getContext('2d');
    const canvasSize = wheelCanvas.width;
    const center = canvasSize / 2;

    // 结果弹窗
    const resultModal = document.getElementById('result-modal');
    const resultText = document.getElementById('result-text');
    const closeModalBtn = document.getElementById('close-modal-btn');


    /*
     * ========================================
     * 核心函数 (Functions)
     * ========================================
     */

    /**
     * @name drawWheel
     * @desc 根据 currentOptions 绘制转盘
     */
    function drawWheel() {
        const numOptions = currentOptions.length;
        if (numOptions === 0) return;

        const sliceAngle = (2 * Math.PI) / numOptions; // 每个扇形的角度 (弧度)
        let startAngle = -Math.PI / 2; // 从 12 点钟方向开始绘制

        // 清空画布
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // 循环绘制每个扇形
        currentOptions.forEach((option, i) => {
            const endAngle = startAngle + sliceAngle;

            // 绘制扇形
            ctx.beginPath();
            ctx.fillStyle = sliceColors[i % sliceColors.length];
            ctx.moveTo(center, center);
            ctx.arc(center, center, center - 10, startAngle, endAngle); // -10 留出边框空间
            ctx.closePath();
            ctx.fill();

            // 绘制文字
            ctx.save();
            ctx.fillStyle = "#333"; // 文字颜色
            ctx.font = 'bold 16px "DingTalk JinBuTi"'; // 文字字体
            ctx.translate(center, center); // 将原点移动到圆心
            ctx.rotate(startAngle + sliceAngle / 2); // 旋转到扇形的中心
            ctx.textAlign = "right"; // 文字右对齐，使其在半径上
            ctx.textBaseline = "middle"; // 文字垂直居中
            ctx.fillText(option.name || option, center - 20, 0); // 在距离圆心 20px 的地方绘制文字
            ctx.restore(); // 恢复画布状态

            startAngle = endAngle; // 更新下一个扇形的起始角度
        });
    }

    /**
     * @name spinWheel
     * @desc 旋转转盘
     */
    function spinWheel() {
        if (isSpinning) return; // 如果正在旋转，则不执行
        isSpinning = true;
        spinBtn.disabled = true; // 禁用按钮
        pointer.classList.add('is-spinning'); // 添加指针按压动画

        const spinDuration = 6000; // 旋转持续时间 (必须与 SCSS 中的 transition 一致)
        const numOptions = currentOptions.length;

        // 1. 计算旋转角度
        const fullSpins = 8; // 至少转 8 圈
        const randomStopIndex = Math.floor(Math.random() * numOptions); // 随机一个停止的索引
        const sliceAngleDeg = 360 / numOptions; // 每个扇形的角度 (度)

        // 我们希望指针指向扇形的中心，而不是边缘
        const randomAngleInSlice = (Math.random() - 0.5) * sliceAngleDeg * 0.8; // 在扇形中心 ±40% 范围内随机

        // 计算目标角度
        // (360 - sliceAngleDeg * randomStopIndex) 是为了让索引 0 对齐 12 点钟方向
        // - sliceAngleDeg / 2 是为了对齐到扇形中心
        const targetAngle = (360 - sliceAngleDeg * randomStopIndex) - (sliceAngleDeg / 2) + randomAngleInSlice;

        // 总旋转角度 = 基础圈数 + 目标角度 + 减去当前已旋转的角度
        const totalRotation = (fullSpins * 360) + targetAngle;

        // 确保是增量旋转
        const newRotation = totalRotation; // 我们每次重置转盘，所以不需要 currentRotation

        // 2. 应用 CSS 旋转
        wheelCanvas.style.transform = `rotate(${newRotation}deg)`;
        currentRotation = newRotation; // 存储当前角度

        // 3. 旋转结束后显示结果
        setTimeout(() => {
            const winner = currentOptions[randomStopIndex]; // 获取中奖选项
            showResult(winner);
        }, spinDuration);
    }

    /**
     * @name showResult
     * @desc 显示结果弹窗
     * @param {object} winner - 中奖的选项对象
     */
    function showResult(winner) {
        // 获取结果DOM元素
        const resultText = document.getElementById('result-text');
        const resultPrice = document.getElementById('result-price');
        const resultLocation = document.getElementById('result-location');

        // 设置弹窗内容
        resultText.textContent = winner.name || winner; // 食物名称

        // 只有当有价格和位置信息时才显示
        if (winner.price && winner.price !== "") {
            resultPrice.textContent = `参考价格: ${winner.price}`;
            resultPrice.style.display = 'block';
        } else {
            resultPrice.style.display = 'none';
        }

        if (winner.location && winner.location !== "") {
            resultLocation.textContent = `推荐地点: ${winner.location}`;
            resultLocation.style.display = 'block';
        } else {
            resultLocation.style.display = 'none';
        }

        // 显示弹窗
        resultModal.style.display = 'flex';
        pointer.classList.remove('is-spinning'); // 移除指针动画
    }

    /**
     * @name switchScreen
     * @desc 切换界面
     * @param {string} type - 'daily' 或 'fancy'
     */
    function switchScreen(type) {
        currentOptions = (type === 'daily') ? dailyOptions : fancyOptions;
        drawWheel(); // 绘制新转盘

        // 切换界面显示
        choiceScreen.style.display = 'none';
        wheelScreen.style.display = 'flex';

        // 重置转盘状态
        resetWheel();
    }

    /**
     * @name resetWheel
     * @desc 重置转盘的旋转和过渡
     */
    function resetWheel() {
        isSpinning = false;
        spinBtn.disabled = false;

        // 关键：先移除 transition，立刻重置角度，再加回 transition
        wheelCanvas.style.transition = 'none'; // 移除过渡
        wheelCanvas.style.transform = 'rotate(0deg)'; // 立刻归零
        currentRotation = 0;

        // 强制浏览器重新渲染
        // 否则浏览器可能会"优化"掉这次重置
        wheelCanvas.offsetHeight;

        // 加回过渡
        wheelCanvas.style.transition = 'transform 6s cubic-bezier(0.1, 0.7, 0.3, 1)';
    }

    /*
     * ========================================
     * 事件监听 (Event Listeners)
     * ========================================
     */

    // 1. (加载时) 显示主容器
    mainContainer.style.display = 'block';

    // 2. 点击 "随便吃点"
    btnDaily.addEventListener('click', () => switchScreen('daily'));

    // 3. 点击 "吃点好的"
    btnFancy.addEventListener('click', () => switchScreen('fancy'));

    // 4. 点击 "返回"
    backBtn.addEventListener('click', () => {
        wheelScreen.style.display = 'none';
        choiceScreen.style.display = 'flex';
    });

    // 5. 点击 "开抽！"
    spinBtn.addEventListener('click', spinWheel);

    // 6. 点击 "关闭弹窗"
    closeModalBtn.addEventListener('click', () => {
        resultModal.style.display = 'none';
        resetWheel(); // 关闭弹窗时重置转盘
    });

    // 7. 点击 "再转一次"
    const spinAgainBtn = document.getElementById('spin-again-btn');
    if (spinAgainBtn) {
        spinAgainBtn.addEventListener('click', () => {
            resultModal.style.display = 'none';
            resetWheel(); // 重置转盘
            spinWheel(); // 直接开始旋转
        });
    }

});
