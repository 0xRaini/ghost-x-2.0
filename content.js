// content.js

// --- 全局变量 ---
let currentSettings = {
    ghostModeEnabled: false,
    filterKeyword: ''
};

// --- 辅助工具函数 ---

/**
 * 安全的 Chrome Storage 操作包装器
 * @param {string} method - 'get' 或 'set'
 * @param {string} storageType - 'local' 或 'sync'
 * @param {*} data - 要存储或获取的数据
 * @returns {Promise} 返回 Promise
 */
function safeStorageOperation(method, storageType, data) {
    return new Promise((resolve, reject) => {
        try {
            const storage = chrome.storage[storageType];
            if (!storage) {
                reject(new Error(`Storage type "${storageType}" not available`));
                return;
            }

            if (method === 'get') {
                storage.get(data, (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('Storage get error:', chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                });
            } else if (method === 'set') {
                storage.set(data, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Storage set error:', chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else {
                reject(new Error(`Unknown method: ${method}`));
            }
        } catch (error) {
            console.error('Storage operation failed:', error);
            reject(error);
        }
    });
}

/**
 * 验证推文 ID 是否有效
 * @param {string} tweetId - 推文 ID
 * @returns {boolean} 是否有效
 */
function isValidTweetId(tweetId) {
    return tweetId && typeof tweetId === 'string' && tweetId.trim().length > 0;
}

/**
 * 清理和验证文本输入
 * @param {string} text - 输入文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 清理后的文本
 */
function sanitizeText(text, maxLength = 280) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().substring(0, maxLength);
}

// --- 初始化 ---

// 首次加载时从存储中获取设置
chrome.storage.sync.get(['ghostModeEnabled', 'filterKeyword'], (result) => {
    if (chrome.runtime.lastError) {
        console.error('GhostX 加载设置失败:', chrome.runtime.lastError);
        // 使用默认设置继续
        currentSettings.ghostModeEnabled = false;
        currentSettings.filterKeyword = '';
    } else {
        currentSettings.ghostModeEnabled = !!result.ghostModeEnabled;
        currentSettings.filterKeyword = result.filterKeyword || '';
        console.log('GhostX 已加载设置:', currentSettings);
    }

    // 等待页面加载完成后再处理推文
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(processAllTweets, 1000); // 延迟1秒确保页面完全加载
        });
    } else {
        setTimeout(processAllTweets, 1000);
    }
});

// 监听来自 popup 的设置变更消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'settingsChanged') {
        chrome.storage.sync.get(['ghostModeEnabled', 'filterKeyword'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('GhostX 更新设置失败:', chrome.runtime.lastError);
                sendResponse({ status: 'error', error: chrome.runtime.lastError.message });
                return;
            }
            currentSettings.ghostModeEnabled = !!result.ghostModeEnabled;
            currentSettings.filterKeyword = result.filterKeyword || '';
            console.log('GhostX 已更新设置:', currentSettings);
            // 设置变更后，重新处理所有推文
            processAllTweets();
            sendResponse({ status: 'success', message: '设置已更新' });
        });
    }
    return true; // 保持消息通道开放以进行异步响应
});


// --- DOM 监听与操作 ---

// 使用 MutationObserver 监听新推文的加载
const observer = new MutationObserver((mutations) => {
    try {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                try {
                    // 检查添加的节点是否是推文容器
                    if (node.nodeType === 1) {
                        if (node.querySelector && node.querySelector('article[data-testid="tweet"]')) {
                            const tweets = node.querySelectorAll('article[data-testid="tweet"]');
                            tweets.forEach(tweet => {
                                if (!tweet.dataset.ghostProcessed) {
                                    tweet.dataset.ghostProcessed = 'true';
                                    processTweet(tweet);
                                }
                            });
                        } else if (node.matches && node.matches('article[data-testid="tweet"]')) {
                            if (!node.dataset.ghostProcessed) {
                                node.dataset.ghostProcessed = 'true';
                                processTweet(node);
                            }
                        }
                    }
                } catch (error) {
                    console.error('GhostX 处理节点时出错:', error);
                }
            });
        });
    } catch (error) {
        console.error('GhostX MutationObserver 错误:', error);
    }
});

// 启动监听，带错误处理
try {
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('GhostX MutationObserver 已启动');
    } else {
        console.warn('GhostX: document.body 尚未就绪');
    }
} catch (error) {
    console.error('GhostX 启动 MutationObserver 失败:', error);
}

/**
 * 处理页面上的所有推文
 */
function processAllTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    let processedCount = 0;
    tweets.forEach(tweet => {
        if (!tweet.dataset.ghostProcessed) {
            tweet.dataset.ghostProcessed = 'true';
            processTweet(tweet);
            processedCount++;
        }
    });
    console.log(`已处理 ${processedCount} 条新推文，总共 ${tweets.length} 条推文。`);
}


/**
 * 处理单条推文：应用过滤和注入幽灵回复UI
 * @param {HTMLElement} tweetElement
 */
function processTweet(tweetElement) {
    if (!tweetElement) return;

    // 应用过滤
    filterTweet(tweetElement);

    // 记录推文浏览
    recordTweetView(tweetElement);

    // 注入幽灵回复 UI
    injectGhostReplyUI(tweetElement);
}


// --- 核心功能：过滤 ---

/**
 * 根据关键词过滤推文
 * @param {HTMLElement} tweetElement
 */
function filterTweet(tweetElement) {
    // 寻找推文的父级容器元素，用于隐藏整个单元
    const container = tweetElement.closest('div[data-testid="cellInnerDiv"]');
    if (!container) return;

    const tweetText = tweetElement.querySelector('div[data-testid="tweetText"]')?.innerText || '';

    if (currentSettings.ghostModeEnabled && currentSettings.filterKeyword) {
        if (tweetText.toLowerCase().includes(currentSettings.filterKeyword.toLowerCase())) {
            container.style.display = 'block'; // 显示匹配的
        } else {
            container.style.display = 'none'; // 隐藏不匹配的
        }
    } else {
        container.style.display = 'block'; // 如果模式关闭，全部显示
    }
}


// --- 核心功能：幽灵回复 ---

/**
 * 注入幽灵回复 UI 到推文中
 * @param {HTMLElement} tweetElement
 */
function injectGhostReplyUI(tweetElement) {
    // 确保不重复注入
    if (tweetElement.querySelector('.ghost-reply-container')) {
        return;
    }

    const tweetId = getTweetId(tweetElement);
    if (!tweetId) {
        // console.error("无法获取 Tweet ID");
        return;
    }

    // 创建容器
    const container = document.createElement('div');
    container.className = 'ghost-reply-container';
    container.style.cssText = `
        border-top: 1px solid rgb(239, 243, 244);
        margin: 10px 15px 0 15px;
        padding-top: 10px;
    `;

    // 标题
    const title = document.createElement('h3');
    title.textContent = '👻 幽灵回复 (仅插件用户可见)';
    title.style.cssText = `
        font-size: 14px;
        font-weight: bold;
        color: #536471;
        margin-bottom: 10px;
    `;
    container.appendChild(title);
    
    // 群组信息显示
    const groupInfo = document.createElement('div');
    groupInfo.className = 'group-info-display';
    groupInfo.style.cssText = `
        font-size: 12px;
        color: #1DA1F2;
        margin-bottom: 8px;
        padding: 4px 8px;
        background-color: #e8f5e8;
        border-radius: 4px;
        display: none;
    `;
    container.appendChild(groupInfo);

    // 回复列表
    const repliesList = document.createElement('div');
    repliesList.className = 'ghost-replies-list';
    container.appendChild(repliesList);

    // 输入框容器
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
        margin-top: 10px;
        position: relative;
    `;

    // 输入框
    const inputBox = document.createElement('textarea');
    inputBox.placeholder = '添加一条幽灵回复...';
    inputBox.className = 'ghost-reply-input';
    inputBox.style.cssText = `
        width: 100%;
        min-height: 50px;
        border: 1px solid #cfd9de;
        border-radius: 8px;
        padding: 8px;
        font-size: 15px;
        resize: vertical;
        font-family: inherit;
        box-sizing: border-box;
    `;
    
    // 字符计数
    const charCount = document.createElement('div');
    charCount.style.cssText = `
        font-size: 12px;
        color: #536471;
        text-align: right;
        margin-top: 4px;
    `;
    
    inputBox.addEventListener('input', () => {
        const length = inputBox.value.length;
        charCount.textContent = `${length}/280`;
        if (length > 280) {
            charCount.style.color = '#e0245e';
        } else if (length > 250) {
            charCount.style.color = '#ffad1f';
        } else {
            charCount.style.color = '#536471';
        }
    });

    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
    `;

    // 发送按钮
    const sendButton = document.createElement('button');
    sendButton.textContent = '发送';
    sendButton.className = 'ghost-reply-send';
    sendButton.style.cssText = `
        background-color: #1DA1F2;
        color: white;
        border: none;
        border-radius: 9999px;
        padding: 8px 16px;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    `;
    
    sendButton.addEventListener('mouseenter', () => {
        sendButton.style.backgroundColor = '#1991db';
    });
    
    sendButton.addEventListener('mouseleave', () => {
        sendButton.style.backgroundColor = '#1DA1F2';
    });
    
    sendButton.onclick = () => {
        const replyText = inputBox.value.trim();
        if (replyText && replyText.length <= 280) {
            // 显示发送中状态
            const originalText = sendButton.textContent;
            sendButton.textContent = '发送中...';
            sendButton.disabled = true;
            
            saveGhostReply(tweetId, replyText, () => {
                inputBox.value = '';
                charCount.textContent = '0/280';
                sendButton.textContent = originalText;
                sendButton.disabled = false;
                loadGhostReplies(tweetId, repliesList);
                
                // 显示成功提示
                showNotification('幽灵回复已发送！', 'success');
            });
        } else if (replyText.length > 280) {
            showNotification('回复内容不能超过280个字符', 'error');
        }
    };

    // 清空按钮
    const clearButton = document.createElement('button');
    clearButton.textContent = '清空';
    clearButton.style.cssText = `
        background-color: transparent;
        color: #536471;
        border: 1px solid #cfd9de;
        border-radius: 9999px;
        padding: 8px 16px;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    `;
    
    clearButton.addEventListener('mouseenter', () => {
        clearButton.style.backgroundColor = '#f7f9fa';
    });
    
    clearButton.addEventListener('mouseleave', () => {
        clearButton.style.backgroundColor = 'transparent';
    });
    
    clearButton.onclick = () => {
        inputBox.value = '';
        charCount.textContent = '0/280';
        inputBox.focus();
    };

    // 幽灵转帖按钮
    const retweetButton = document.createElement('button');
    retweetButton.textContent = '🔄 幽灵转帖';
    retweetButton.className = 'ghost-retweet-btn';
    retweetButton.style.cssText = `
        background-color: #17bf63;
        color: white;
        border: none;
        border-radius: 9999px;
        padding: 8px 16px;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    `;
    
    retweetButton.addEventListener('mouseenter', () => {
        retweetButton.style.backgroundColor = '#15a85a';
    });
    
    retweetButton.addEventListener('mouseleave', () => {
        retweetButton.style.backgroundColor = '#17bf63';
    });
    
    retweetButton.onclick = () => {
        saveGhostRetweet(tweetId, () => {
            showNotification('幽灵转帖成功！', 'success');
            loadGhostRetweets(tweetId, container);
        });
    };

    // 幽灵收藏按钮
    const likeButton = document.createElement('button');
    likeButton.textContent = '❤️ 幽灵收藏';
    likeButton.className = 'ghost-like-btn';
    likeButton.style.cssText = `
        background-color: #e0245e;
        color: white;
        border: none;
        border-radius: 9999px;
        padding: 8px 16px;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    `;
    
    likeButton.addEventListener('mouseenter', () => {
        likeButton.style.backgroundColor = '#c91e56';
    });
    
    likeButton.addEventListener('mouseleave', () => {
        likeButton.style.backgroundColor = '#e0245e';
    });
    
    likeButton.onclick = () => {
        saveGhostLike(tweetId, () => {
            showNotification('幽灵收藏成功！', 'success');
            loadGhostLikes(tweetId, container);
        });
    };

    // 组装输入区域
    inputContainer.appendChild(inputBox);
    inputContainer.appendChild(charCount);
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(retweetButton);
    buttonContainer.appendChild(likeButton);
    buttonContainer.appendChild(sendButton);
    inputContainer.appendChild(buttonContainer);
    container.appendChild(inputContainer);

    // 将整个 UI 插入到推文操作栏（回复、转推、喜欢）之前
    const actionBar = tweetElement.querySelector('div[role="group"]');
    if (actionBar && actionBar.parentNode) {
        try {
        actionBar.parentNode.insertBefore(container, actionBar);
        // 加载已有的回复
        loadGhostReplies(tweetId, repliesList);
        } catch (error) {
            console.error('插入幽灵回复UI时出错:', error);
        }
    } else {
        console.warn('无法找到推文操作栏，跳过幽灵回复UI注入');
    }
}


/**
 * 从推文元素中提取唯一的 ID
 * @param {HTMLElement} tweetElement
 * @returns {string|null}
 */
function getTweetId(tweetElement) {
    // 方法1: 从链接中提取
    const links = tweetElement.querySelectorAll('a');
    for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.includes('/status/')) {
            const parts = href.split('/');
            const statusIndex = parts.indexOf('status');
            if (statusIndex !== -1 && parts[statusIndex + 1]) {
                const tweetId = parts[statusIndex + 1].split('?')[0];
                if (/^\d+$/.test(tweetId)) { // 确保是数字 ID
                    return tweetId;
                }
            }
        }
    }
    
    // 方法2: 从data属性中提取
    const tweetData = tweetElement.querySelector('[data-tweet-id]');
    if (tweetData) {
        const tweetId = tweetData.getAttribute('data-tweet-id');
        if (/^\d+$/.test(tweetId)) {
            return tweetId;
        }
    }
    
    // 方法3: 从URL路径中提取
    const currentUrl = window.location.href;
    if (currentUrl.includes('/status/')) {
        const urlParts = currentUrl.split('/status/');
        if (urlParts.length > 1) {
            const tweetId = urlParts[1].split('?')[0].split('/')[0];
            if (/^\d+$/.test(tweetId)) {
                return tweetId;
            }
        }
    }
    
    return null;
}


/**
 * 保存一条幽灵回复到本地存储
 * @param {string} tweetId
 * @param {string} text
 * @param {Function} callback
 */
function saveGhostReply(tweetId, text, callback) {
    // 输入验证
    if (!isValidTweetId(tweetId)) {
        console.error('Invalid tweet ID:', tweetId);
        if (callback) callback(new Error('Invalid tweet ID'));
        return;
    }

    const sanitizedText = sanitizeText(text, 280);
    if (!sanitizedText) {
        console.error('Empty or invalid reply text');
        if (callback) callback(new Error('Empty reply text'));
        return;
    }

    const key = `ghost-reply-${tweetId}`;

    safeStorageOperation('get', 'local', [key, 'currentGroup', 'twitterUser'])
        .then((result) => {
            const replies = Array.isArray(result[key]) ? result[key] : [];
            const currentGroup = result.currentGroup;
            const twitterUser = result.twitterUser;
        
        let authorInfo = {
            type: 'anonymous',
            name: '匿名用户',
            handle: '',
            avatar: '',
            verified: false
        };
        
        if (twitterUser) {
            authorInfo = {
                type: 'twitter',
                name: twitterUser.name,
                handle: twitterUser.handle,
                avatar: twitterUser.avatar,
                verified: twitterUser.verified || false
            };
        } else if (currentGroup) {
            authorInfo = {
                type: 'group',
                name: '群组成员',
                handle: '',
                avatar: '',
                verified: false
            };
        }
        
            const reply = {
                text: sanitizedText,
                timestamp: new Date().toISOString(),
                groupId: currentGroup ? currentGroup.id : null,
                groupName: currentGroup ? currentGroup.name : null,
                author: authorInfo
            };

            replies.push(reply);

            return safeStorageOperation('set', 'local', { [key]: replies });
        })
        .then(() => {
            console.log('Ghost reply saved successfully');
            if (callback) callback(null);
        })
        .catch((error) => {
            console.error('Failed to save ghost reply:', error);
            if (callback) callback(error);
        });
}

/**
 * 从本地存储加载并显示幽灵回复
 * @param {string} tweetId
 * @param {HTMLElement} listElement
 */
function loadGhostReplies(tweetId, listElement) {
    listElement.innerHTML = ''; // 清空现有列表
    const key = `ghost-reply-${tweetId}`;
    chrome.storage.local.get([key, 'currentGroup', 'twitterUser'], (result) => {
        const replies = result[key] || [];
        const currentGroup = result.currentGroup;
        
        // 更新群组信息显示
        const groupInfoDisplay = listElement.parentElement.querySelector('.group-info-display');
        if (currentGroup && groupInfoDisplay) {
            groupInfoDisplay.textContent = `群组: ${currentGroup.name} (${currentGroup.members.length}人)`;
            groupInfoDisplay.style.display = 'block';
        } else if (groupInfoDisplay) {
            groupInfoDisplay.style.display = 'none';
        }
        
        if (replies.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.cssText = `
                text-align: center;
                color: #536471;
                font-size: 14px;
                padding: 20px;
                font-style: italic;
            `;
            emptyDiv.textContent = currentGroup ? 
                '群组内还没有幽灵回复，来添加第一条吧！' : 
                '还没有幽灵回复，来添加第一条吧！';
            listElement.appendChild(emptyDiv);
            return;
        }
        
        // 按时间倒序排列（最新的在前）
        replies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        replies.forEach((reply, index) => {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'ghost-reply-item';
            replyDiv.style.cssText = `
                padding: 12px;
                border-bottom: 1px solid #eff3f4;
                font-size: 14px;
                position: relative;
                transition: background-color 0.2s;
            `;
            
            replyDiv.addEventListener('mouseenter', () => {
                replyDiv.style.backgroundColor = '#f7f9fa';
            });
            
            replyDiv.addEventListener('mouseleave', () => {
                replyDiv.style.backgroundColor = 'transparent';
            });

            // 回复内容
            const textP = document.createElement('p');
            textP.textContent = reply.text;
            textP.style.cssText = `
                margin: 0 0 8px 0;
                line-height: 1.4;
                word-wrap: break-word;
            `;

            // 作者信息显示
            const authorDiv = document.createElement('div');
            authorDiv.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            `;
            
            // 用户头像
            if (reply.author && reply.author.avatar) {
                const avatarImg = document.createElement('img');
                avatarImg.src = reply.author.avatar;
                avatarImg.style.cssText = `
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    margin-right: 8px;
                `;
                authorDiv.appendChild(avatarImg);
            }
            
            // 用户信息
            const authorInfo = document.createElement('div');
            authorInfo.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
            `;
            
            const authorName = document.createElement('span');
            authorName.textContent = reply.author ? reply.author.name : '匿名用户';
            authorName.style.cssText = `
                font-weight: bold;
                font-size: 12px;
                color: #14171a;
            `;
            
            const authorHandle = document.createElement('span');
            if (reply.author && reply.author.handle) {
                authorHandle.textContent = reply.author.handle;
                authorHandle.style.cssText = `
                    font-size: 12px;
                    color: #536471;
                `;
            }
            
            // 认证标识
            if (reply.author && reply.author.verified) {
                const verifiedIcon = document.createElement('span');
                verifiedIcon.textContent = '✓';
                verifiedIcon.style.cssText = `
                    color: #1DA1F2;
                    font-size: 12px;
                    font-weight: bold;
                `;
                authorInfo.appendChild(verifiedIcon);
            }
            
            authorInfo.appendChild(authorName);
            if (authorHandle.textContent) {
                authorInfo.appendChild(authorHandle);
            }
            
            // 群组信息
            if (reply.groupName) {
                const groupInfo = document.createElement('span');
                groupInfo.textContent = `来自群组"${reply.groupName}"`;
                groupInfo.style.cssText = `
                    font-size: 11px;
                    color: #1DA1F2;
                    background-color: #e8f5e8;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                `;
                authorInfo.appendChild(groupInfo);
            }
            
            authorDiv.appendChild(authorInfo);

            // 时间和操作按钮容器
            const footerDiv = document.createElement('div');
            footerDiv.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatTimeAgo(new Date(reply.timestamp));
            timeSpan.style.cssText = `
                font-size: 12px;
                color: #536471;
            `;

            // 删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.style.cssText = `
                background: none;
                border: none;
                color: #e0245e;
                font-size: 12px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.2s;
            `;
            
            deleteButton.addEventListener('mouseenter', () => {
                deleteButton.style.backgroundColor = '#ffeef0';
            });
            
            deleteButton.addEventListener('mouseleave', () => {
                deleteButton.style.backgroundColor = 'transparent';
            });
            
            deleteButton.onclick = () => {
                if (confirm('确定要删除这条幽灵回复吗？')) {
                    deleteGhostReply(tweetId, index, () => {
                        loadGhostReplies(tweetId, listElement);
                        showNotification('幽灵回复已删除', 'success');
                    });
                }
            };

            footerDiv.appendChild(timeSpan);
            footerDiv.appendChild(deleteButton);
            
            replyDiv.appendChild(authorDiv);
            replyDiv.appendChild(textP);
            replyDiv.appendChild(footerDiv);
            listElement.appendChild(replyDiv);
        });
        
        // 加载幽灵转帖和收藏
        const container = listElement.closest('.ghost-reply-container');
        if (container) {
            loadGhostRetweets(tweetId, container);
            loadGhostLikes(tweetId, container);
        }
    });
}

/**
 * 删除幽灵回复
 * @param {string} tweetId
 * @param {number} index
 * @param {Function} callback
 */
function deleteGhostReply(tweetId, index, callback) {
    const key = `ghost-reply-${tweetId}`;
    chrome.storage.local.get([key], (result) => {
        const replies = result[key] || [];
        replies.splice(index, 1);
        chrome.storage.local.set({ [key]: replies }, callback);
    });
}

/**
 * 格式化时间为相对时间
 * @param {Date} date
 * @returns {string}
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString();
}

/**
 * 显示通知
 * @param {string} message
 * @param {string} type
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#e8f5e8' : type === 'error' ? '#ffeef0' : '#e3f2fd'};
        color: ${type === 'success' ? '#1e7e34' : type === 'error' ? '#e0245e' : '#1976d2'};
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 3000);
}

/**
 * 保存幽灵转帖
 * @param {string} tweetId
 * @param {Function} callback
 */
function saveGhostRetweet(tweetId, callback) {
    const key = `ghost-retweet-${tweetId}`;
    chrome.storage.local.get([key, 'currentGroup', 'twitterUser'], (result) => {
        const retweets = result[key] || [];
        const currentGroup = result.currentGroup;
        const twitterUser = result.twitterUser;
        
        let authorInfo = {
            type: 'anonymous',
            name: '匿名用户',
            handle: '',
            avatar: '',
            verified: false
        };
        
        if (twitterUser) {
            authorInfo = {
                type: 'twitter',
                name: twitterUser.name,
                handle: twitterUser.handle,
                avatar: twitterUser.avatar,
                verified: twitterUser.verified || false
            };
        } else if (currentGroup) {
            authorInfo = {
                type: 'group',
                name: '群组成员',
                handle: '',
                avatar: '',
                verified: false
            };
        }
        
        const retweet = {
            timestamp: new Date().toISOString(),
            groupId: currentGroup ? currentGroup.id : null,
            groupName: currentGroup ? currentGroup.name : null,
            author: authorInfo
        };
        
        retweets.push(retweet);
        chrome.storage.local.set({ [key]: retweets }, callback);
    });
}

/**
 * 保存幽灵收藏
 * @param {string} tweetId
 * @param {Function} callback
 */
function saveGhostLike(tweetId, callback) {
    const key = `ghost-like-${tweetId}`;
    chrome.storage.local.get([key, 'currentGroup', 'twitterUser'], (result) => {
        const likes = result[key] || [];
        const currentGroup = result.currentGroup;
        const twitterUser = result.twitterUser;
        
        let authorInfo = {
            type: 'anonymous',
            name: '匿名用户',
            handle: '',
            avatar: '',
            verified: false
        };
        
        if (twitterUser) {
            authorInfo = {
                type: 'twitter',
                name: twitterUser.name,
                handle: twitterUser.handle,
                avatar: twitterUser.avatar,
                verified: twitterUser.verified || false
            };
        } else if (currentGroup) {
            authorInfo = {
                type: 'group',
                name: '群组成员',
                handle: '',
                avatar: '',
                verified: false
            };
        }
        
        const like = {
            timestamp: new Date().toISOString(),
            groupId: currentGroup ? currentGroup.id : null,
            groupName: currentGroup ? currentGroup.name : null,
            author: authorInfo
        };
        
        likes.push(like);
        chrome.storage.local.set({ [key]: likes }, callback);
    });
}

/**
 * 加载幽灵转帖
 * @param {string} tweetId
 * @param {HTMLElement} container
 */
function loadGhostRetweets(tweetId, container) {
    const key = `ghost-retweet-${tweetId}`;
    chrome.storage.local.get([key, 'currentGroup', 'twitterUser'], (result) => {
        const retweets = result[key] || [];
        const currentGroup = result.currentGroup;
        
        // 查找或创建转帖显示区域
        let retweetsSection = container.querySelector('.ghost-retweets-section');
        if (!retweetsSection) {
            retweetsSection = document.createElement('div');
            retweetsSection.className = 'ghost-retweets-section';
            retweetsSection.style.cssText = `
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #e1e8ed;
            `;
            
            const retweetsTitle = document.createElement('h4');
            retweetsTitle.textContent = '🔄 幽灵转帖';
            retweetsTitle.style.cssText = `
                font-size: 13px;
                font-weight: bold;
                color: #17bf63;
                margin-bottom: 8px;
            `;
            retweetsSection.appendChild(retweetsTitle);
            
            const retweetsList = document.createElement('div');
            retweetsList.className = 'ghost-retweets-list';
            retweetsSection.appendChild(retweetsList);
            
            container.appendChild(retweetsSection);
        }
        
        const retweetsList = retweetsSection.querySelector('.ghost-retweets-list');
        retweetsList.innerHTML = '';
        
        if (retweets.length === 0) {
            retweetsSection.style.display = 'none';
            return;
        }
        
        retweetsSection.style.display = 'block';
        
        retweets.forEach((retweet, index) => {
            const retweetDiv = document.createElement('div');
            retweetDiv.style.cssText = `
                background-color: #f7f9fa;
                border-radius: 8px;
                padding: 8px;
                margin-bottom: 6px;
                font-size: 13px;
            `;
            
            // 作者信息
            const authorDiv = document.createElement('div');
            authorDiv.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            `;
            
            if (retweet.author && retweet.author.avatar) {
                const avatarImg = document.createElement('img');
                avatarImg.src = retweet.author.avatar;
                avatarImg.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    margin-right: 6px;
                `;
                authorDiv.appendChild(avatarImg);
            }
            
            const authorInfo = document.createElement('div');
            authorInfo.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
            `;
            
            const authorName = document.createElement('span');
            authorName.textContent = retweet.author ? retweet.author.name : '匿名用户';
            authorName.style.cssText = `
                font-weight: bold;
                font-size: 12px;
                color: #14171a;
            `;
            
            const authorHandle = document.createElement('span');
            if (retweet.author && retweet.author.handle) {
                authorHandle.textContent = retweet.author.handle;
                authorHandle.style.cssText = `
                    font-size: 12px;
                    color: #536471;
                `;
            }
            
            if (retweet.author && retweet.author.verified) {
                const verifiedIcon = document.createElement('span');
                verifiedIcon.textContent = '✓';
                verifiedIcon.style.cssText = `
                    color: #1DA1F2;
                    font-size: 12px;
                    font-weight: bold;
                `;
                authorInfo.appendChild(verifiedIcon);
            }
            
            authorInfo.appendChild(authorName);
            if (authorHandle.textContent) {
                authorInfo.appendChild(authorHandle);
            }
            
            if (retweet.groupName) {
                const groupInfo = document.createElement('span');
                groupInfo.textContent = `来自群组"${retweet.groupName}"`;
                groupInfo.style.cssText = `
                    font-size: 11px;
                    color: #17bf63;
                    background-color: #e8f5e8;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                `;
                authorInfo.appendChild(groupInfo);
            }
            
            authorDiv.appendChild(authorInfo);
            
            // 时间信息
            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatTimeAgo(new Date(retweet.timestamp));
            timeSpan.style.cssText = `
                font-size: 11px;
                color: #536471;
            `;
            
            retweetDiv.appendChild(authorDiv);
            retweetDiv.appendChild(timeSpan);
            retweetsList.appendChild(retweetDiv);
        });
    });
}

/**
 * 加载幽灵收藏
 * @param {string} tweetId
 * @param {HTMLElement} container
 */
function loadGhostLikes(tweetId, container) {
    const key = `ghost-like-${tweetId}`;
    chrome.storage.local.get([key, 'currentGroup', 'twitterUser'], (result) => {
        const likes = result[key] || [];
        const currentGroup = result.currentGroup;
        
        // 查找或创建收藏显示区域
        let likesSection = container.querySelector('.ghost-likes-section');
        if (!likesSection) {
            likesSection = document.createElement('div');
            likesSection.className = 'ghost-likes-section';
            likesSection.style.cssText = `
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #e1e8ed;
            `;
            
            const likesTitle = document.createElement('h4');
            likesTitle.textContent = '❤️ 幽灵收藏';
            likesTitle.style.cssText = `
                font-size: 13px;
                font-weight: bold;
                color: #e0245e;
                margin-bottom: 8px;
            `;
            likesSection.appendChild(likesTitle);
            
            const likesList = document.createElement('div');
            likesList.className = 'ghost-likes-list';
            likesSection.appendChild(likesList);
            
            container.appendChild(likesSection);
        }
        
        const likesList = likesSection.querySelector('.ghost-likes-list');
        likesList.innerHTML = '';
        
        if (likes.length === 0) {
            likesSection.style.display = 'none';
            return;
        }
        
        likesSection.style.display = 'block';
        
        likes.forEach((like, index) => {
            const likeDiv = document.createElement('div');
            likeDiv.style.cssText = `
                background-color: #f7f9fa;
                border-radius: 8px;
                padding: 8px;
                margin-bottom: 6px;
                font-size: 13px;
            `;
            
            // 作者信息
            const authorDiv = document.createElement('div');
            authorDiv.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            `;
            
            if (like.author && like.author.avatar) {
                const avatarImg = document.createElement('img');
                avatarImg.src = like.author.avatar;
                avatarImg.style.cssText = `
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    margin-right: 6px;
                `;
                authorDiv.appendChild(avatarImg);
            }
            
            const authorInfo = document.createElement('div');
            authorInfo.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
            `;
            
            const authorName = document.createElement('span');
            authorName.textContent = like.author ? like.author.name : '匿名用户';
            authorName.style.cssText = `
                font-weight: bold;
                font-size: 12px;
                color: #14171a;
            `;
            
            const authorHandle = document.createElement('span');
            if (like.author && like.author.handle) {
                authorHandle.textContent = like.author.handle;
                authorHandle.style.cssText = `
                    font-size: 12px;
                    color: #536471;
                `;
            }
            
            if (like.author && like.author.verified) {
                const verifiedIcon = document.createElement('span');
                verifiedIcon.textContent = '✓';
                verifiedIcon.style.cssText = `
                    color: #1DA1F2;
                    font-size: 12px;
                    font-weight: bold;
                `;
                authorInfo.appendChild(verifiedIcon);
            }
            
            authorInfo.appendChild(authorName);
            if (authorHandle.textContent) {
                authorInfo.appendChild(authorHandle);
            }
            
            if (like.groupName) {
                const groupInfo = document.createElement('span');
                groupInfo.textContent = `来自群组"${like.groupName}"`;
                groupInfo.style.cssText = `
                    font-size: 11px;
                    color: #e0245e;
                    background-color: #fce8f0;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                `;
                authorInfo.appendChild(groupInfo);
            }
            
            authorDiv.appendChild(authorInfo);
            
            // 时间信息
            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatTimeAgo(new Date(like.timestamp));
            timeSpan.style.cssText = `
                font-size: 11px;
                color: #536471;
            `;
            
            likeDiv.appendChild(authorDiv);
            likeDiv.appendChild(timeSpan);
            likesList.appendChild(likeDiv);
        });
    });
}

// ==================== 推文浏览记录功能 ====================

/**
 * 记录推文浏览
 * @param {HTMLElement} tweetElement
 */
function recordTweetView(tweetElement) {
    const tweetId = getTweetId(tweetElement);
    if (!tweetId) return;
    
    const tweetData = extractTweetData(tweetElement);
    if (!tweetData) return;
    
    const key = `viewed-tweet-${tweetId}`;
    const timestamp = new Date().toISOString();
    
    chrome.storage.local.get([key], (result) => {
        if (!result[key]) {
            chrome.storage.local.set({
                [key]: {
                    ...tweetData,
                    timestamp: timestamp,
                    viewCount: 1
                }
            });
        }
    });
}

/**
 * 提取推文数据
 * @param {HTMLElement} tweetElement
 * @returns {Object|null}
 */
function extractTweetData(tweetElement) {
    try {
        const textElement = tweetElement.querySelector('div[data-testid="tweetText"]');
        const text = textElement ? textElement.innerText : '';
        
        const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
        const author = authorElement ? {
            name: authorElement.querySelector('span')?.innerText || '',
            handle: authorElement.querySelector('a')?.href?.match(/@\w+/)?.[0] || ''
        } : null;
        
        const images = tweetElement.querySelectorAll('[data-testid="tweetPhoto"]');
        const hasImages = images.length > 0;
        
        const links = tweetElement.querySelectorAll('a[href^="http"]');
        const hasLinks = links.length > 0;
        
        // 尝试获取互动数据
        const likeButton = tweetElement.querySelector('[data-testid="like"]');
        const retweetButton = tweetElement.querySelector('[data-testid="retweet"]');
        const replyButton = tweetElement.querySelector('[data-testid="reply"]');
        
        const likes = extractEngagementNumber(likeButton);
        const retweets = extractEngagementNumber(retweetButton);
        const replies = extractEngagementNumber(replyButton);
        
        return {
            text: text,
            author: author,
            hasImages: hasImages,
            hasLinks: hasLinks,
            likes: likes,
            retweets: retweets,
            replies: replies
        };
    } catch (error) {
        console.error('提取推文数据失败:', error);
        return null;
    }
}

/**
 * 提取互动数字
 * @param {HTMLElement} element
 * @returns {number}
 */
function extractEngagementNumber(element) {
    if (!element) return 0;
    
    const text = element.innerText || '';
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}
