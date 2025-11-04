// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const ghostModeToggle = document.getElementById('ghostModeToggle');
    const filterKeywordInput = document.getElementById('filterKeyword');
    const clearAllRepliesButton = document.getElementById('clearAllReplies');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const joinGroupBtn = document.getElementById('joinGroupBtn');
    const copyInviteBtn = document.getElementById('copyInviteBtn');
    const leaveGroupBtn = document.getElementById('leaveGroupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // 加载设置
    chrome.storage.sync.get(['ghostModeEnabled', 'filterKeyword'], (result) => {
        const enabled = !!result.ghostModeEnabled;
        const keyword = result.filterKeyword || '';
        
        if (ghostModeToggle) {
            if (enabled) {
                ghostModeToggle.classList.add('active');
            } else {
                ghostModeToggle.classList.remove('active');
            }
        }
        
        if (filterKeywordInput) {
            filterKeywordInput.value = keyword;
        }
        
        updateStatus(enabled, keyword);
    });

    // 加载回复统计
    loadReplyStats();
    
    // 加载转帖统计
    loadRetweetStats();
    
    // 加载收藏统计
    loadLikeStats();
    
    // 加载群组信息
    loadGroupInfo();
    
    // 加载用户登录状态
    loadUserAuth();
    
    // 加载幽灵动态
    loadGhostFeed();

    // 当开关状态改变时保存
    if (ghostModeToggle) {
        ghostModeToggle.addEventListener('click', () => {
            const enabled = !ghostModeToggle.classList.contains('active');
            
            if (enabled) {
                ghostModeToggle.classList.add('active');
            } else {
                ghostModeToggle.classList.remove('active');
            }
            
            chrome.storage.sync.set({ ghostModeEnabled: enabled }, () => {
                const keyword = filterKeywordInput ? filterKeywordInput.value : '';
                updateStatus(enabled, keyword);
                sendMessageToContentScript(enabled, keyword);
            });
        });
    }

    // 当关键词输入改变时保存
    if (filterKeywordInput) {
        filterKeywordInput.addEventListener('input', () => {
            const enabled = ghostModeToggle ? ghostModeToggle.classList.contains('active') : false;
            const keyword = filterKeywordInput.value;
            
            chrome.storage.sync.set({ filterKeyword: keyword }, () => {
                updateStatus(enabled, keyword);
                sendMessageToContentScript(enabled, keyword);
            });
        });
    }

    // 清空所有幽灵回复
    if (clearAllRepliesButton) {
        clearAllRepliesButton.addEventListener('click', () => {
            clearAllGhostReplies();
        });
    }

    // 创建群组
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', () => {
            createGroup();
        });
    }

    // 加入群组
    if (joinGroupBtn) {
        joinGroupBtn.addEventListener('click', () => {
            joinGroup();
        });
    }

    // 复制邀请码
    if (copyInviteBtn) {
        copyInviteBtn.addEventListener('click', () => {
            copyInviteCode();
        });
    }

    // 离开群组
    if (leaveGroupBtn) {
        leaveGroupBtn.addEventListener('click', () => {
            leaveGroup();
        });
    }

    // Twitter登录
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginWithTwitter();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('确定要登出吗？')) {
                logoutFromTwitter();
            }
        });
    }
    
    // 清空所有幽灵转帖
    const clearAllRetweetsBtn = document.getElementById('clearAllRetweets');
    if (clearAllRetweetsBtn) {
        clearAllRetweetsBtn.addEventListener('click', () => {
            clearAllGhostRetweets();
        });
    }
    
    // 清空所有幽灵收藏
    const clearAllLikesBtn = document.getElementById('clearAllLikes');
    if (clearAllLikesBtn) {
        clearAllLikesBtn.addEventListener('click', () => {
            clearAllGhostLikes();
        });
    }
    
    // 点击统计数字查看详细内容
    const clickableStats = document.querySelectorAll('.clickable-stat');
    clickableStats.forEach(stat => {
        stat.addEventListener('click', () => {
            const type = stat.getAttribute('data-type');
            showDetailModal(type);
        });
    });
    
    // 刷新幽灵动态
    const refreshFeedBtn = document.getElementById('refreshFeed');
    if (refreshFeedBtn) {
        refreshFeedBtn.addEventListener('click', () => {
            loadGhostFeed();
        });
    }
    
    // 详细查看弹窗关闭
    const detailModal = document.getElementById('detailModal');
    const detailModalClose = document.getElementById('detailModalClose');
    if (detailModal && detailModalClose) {
        detailModalClose.addEventListener('click', () => {
            detailModal.style.display = 'none';
        });
        
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.style.display = 'none';
            }
        });
    }
    
    // 信息流总结功能
    const generateSummaryBtn = document.getElementById('generateSummary');
    if (generateSummaryBtn) {
        generateSummaryBtn.addEventListener('click', () => {
            generateFeedSummary();
        });
    }
});

// 更新状态显示
function updateStatus(enabled, keyword) {
    const status = document.getElementById('status');
    if (!status) return;
    
    if (enabled) {
        status.textContent = `幽灵模式已开启，过滤关键词: "${keyword}"`;
        status.className = 'status enabled';
    } else {
        status.textContent = '幽灵模式已关闭';
        status.className = 'status disabled';
    }
}

// 发送消息到内容脚本
function sendMessageToContentScript(enabled, keyword) {
    const message = {
        action: 'settingsChanged',
        ghostModeEnabled: enabled,
        filterKeyword: keyword
    };
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('发送消息到内容脚本失败:', chrome.runtime.lastError);
                } else {
                    console.log('消息发送成功:', response);
                }
            });
        }
    });
}

// 加载回复统计
function loadReplyStats() {
    chrome.storage.local.get(null, (result) => {
        let totalReplies = 0;
        let todayReplies = 0;
        const today = new Date().toDateString();
        
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-reply-')) {
                const replies = result[key] || [];
                totalReplies += replies.length;
                
                replies.forEach(reply => {
                    const replyDate = new Date(reply.timestamp).toDateString();
                    if (replyDate === today) {
                        todayReplies++;
                    }
                });
            }
        });
        
        const totalRepliesElement = document.getElementById('totalReplies');
        const todayRepliesElement = document.getElementById('todayReplies');
        
        if (totalRepliesElement) {
            totalRepliesElement.textContent = totalReplies;
        }
        if (todayRepliesElement) {
            todayRepliesElement.textContent = todayReplies;
        }
    });
}

// 加载转帖统计
function loadRetweetStats() {
    chrome.storage.local.get(null, (result) => {
        let totalRetweets = 0;
        let todayRetweets = 0;
        const today = new Date().toDateString();
        
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-retweet-')) {
                const retweets = result[key] || [];
                totalRetweets += retweets.length;
                
                retweets.forEach(retweet => {
                    const retweetDate = new Date(retweet.timestamp).toDateString();
                    if (retweetDate === today) {
                        todayRetweets++;
                    }
                });
            }
        });
        
        const totalRetweetsElement = document.getElementById('totalRetweets');
        const todayRetweetsElement = document.getElementById('todayRetweets');
        
        if (totalRetweetsElement) {
            totalRetweetsElement.textContent = totalRetweets;
        }
        if (todayRetweetsElement) {
            todayRetweetsElement.textContent = todayRetweets;
        }
    });
}

// 加载收藏统计
function loadLikeStats() {
    chrome.storage.local.get(null, (result) => {
        let totalLikes = 0;
        let todayLikes = 0;
        const today = new Date().toDateString();
        
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-like-')) {
                const likes = result[key] || [];
                totalLikes += likes.length;
                
                likes.forEach(like => {
                    const likeDate = new Date(like.timestamp).toDateString();
                    if (likeDate === today) {
                        todayLikes++;
                    }
                });
            }
        });
        
        const totalLikesElement = document.getElementById('totalLikes');
        const todayLikesElement = document.getElementById('todayLikes');
        
        if (totalLikesElement) {
            totalLikesElement.textContent = totalLikes;
        }
        if (todayLikesElement) {
            todayLikesElement.textContent = todayLikes;
        }
    });
}

// 清空所有幽灵回复
function clearAllGhostReplies() {
    chrome.storage.local.get(null, (result) => {
        const keysToRemove = Object.keys(result).filter(key => key.startsWith('ghost-reply-'));
        
        if (keysToRemove.length === 0) {
            alert('没有找到任何幽灵回复');
            return;
        }
        
        chrome.storage.local.remove(keysToRemove, () => {
            loadReplyStats();
            alert(`已清空 ${keysToRemove.length} 个推文的所有幽灵回复`);
        });
    });
}

// 清空所有幽灵转帖
function clearAllGhostRetweets() {
    chrome.storage.local.get(null, (result) => {
        const keysToRemove = Object.keys(result).filter(key => key.startsWith('ghost-retweet-'));
        
        if (keysToRemove.length === 0) {
            alert('没有找到任何幽灵转帖');
            return;
        }
        
        chrome.storage.local.remove(keysToRemove, () => {
            loadRetweetStats();
            alert(`已清空 ${keysToRemove.length} 个推文的所有幽灵转帖`);
        });
    });
}

// 清空所有幽灵收藏
function clearAllGhostLikes() {
    chrome.storage.local.get(null, (result) => {
        const keysToRemove = Object.keys(result).filter(key => key.startsWith('ghost-like-'));
        
        if (keysToRemove.length === 0) {
            alert('没有找到任何幽灵收藏');
            return;
        }
        
        chrome.storage.local.remove(keysToRemove, () => {
            loadLikeStats();
            alert(`已清空 ${keysToRemove.length} 个推文的所有幽灵收藏`);
        });
    });
}

// 生成邀请码
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 创建群组
function createGroup() {
    const groupNameInput = document.getElementById('groupName');
    const groupName = groupNameInput ? groupNameInput.value.trim() : '';
    
    if (!groupName) {
        alert('请输入群组名称');
        return;
    }
    
    const inviteCode = generateInviteCode();
    const groupId = 'group_' + Date.now();
    
    const group = {
        id: groupId,
        name: groupName,
        inviteCode: inviteCode,
        createdAt: new Date().toISOString(),
        members: [{
            id: 'admin_' + Date.now(),
            name: '管理员',
            role: 'admin',
            joinedAt: new Date().toISOString()
        }]
    };
    
    chrome.storage.local.set({ currentGroup: group }, () => {
        loadGroupInfo();
        alert(`群组"${groupName}"创建成功！邀请码: ${inviteCode}`);
    });
}

// 加入群组
function joinGroup() {
    const inviteCodeInput = document.getElementById('inviteCode');
    const inviteCode = inviteCodeInput ? inviteCodeInput.value.trim().toUpperCase() : '';
    
    if (!inviteCode) {
        alert('请输入邀请码');
        return;
    }
    
    // 模拟加入群组（实际应用中需要从服务器获取群组信息）
    const mockGroup = {
        id: 'group_' + Date.now(),
        name: '示例群组',
        inviteCode: inviteCode,
        createdAt: new Date().toISOString(),
        members: [
            {
                id: 'admin_001',
                name: '群主',
                role: 'admin',
                joinedAt: new Date().toISOString()
            },
            {
                id: 'member_' + Date.now(),
                name: '新成员',
                role: 'member',
                joinedAt: new Date().toISOString()
            }
        ]
    };
    
    chrome.storage.local.set({ currentGroup: mockGroup }, () => {
        loadGroupInfo();
        alert(`成功加入群组"${mockGroup.name}"！`);
    });
}

// 复制邀请码
function copyInviteCode() {
    chrome.storage.local.get(['currentGroup'], (result) => {
        if (result.currentGroup) {
            navigator.clipboard.writeText(result.currentGroup.inviteCode).then(() => {
                alert('邀请码已复制到剪贴板');
            }).catch(() => {
                alert('复制失败，邀请码: ' + result.currentGroup.inviteCode);
            });
        } else {
            alert('您还没有加入任何群组');
        }
    });
}

// 离开群组
function leaveGroup() {
    if (confirm('确定要离开当前群组吗？')) {
        chrome.storage.local.remove(['currentGroup'], () => {
            loadGroupInfo();
            alert('已成功离开群组');
        });
    }
}

// 加载群组信息
function loadGroupInfo() {
    chrome.storage.local.get(['currentGroup'], (result) => {
        const currentGroupSection = document.getElementById('currentGroupSection');
        const noGroupSection = document.getElementById('noGroupSection');
        const groupNameSpan = document.getElementById('groupName');
        const inviteCodeSpan = document.getElementById('inviteCode');
        const membersList = document.getElementById('membersList');
        
        if (result.currentGroup) {
            const group = result.currentGroup;
            
            if (currentGroupSection) currentGroupSection.style.display = 'block';
            if (noGroupSection) noGroupSection.style.display = 'none';
            
            if (groupNameSpan) groupNameSpan.textContent = group.name;
            if (inviteCodeSpan) inviteCodeSpan.textContent = group.inviteCode;
            
            if (membersList) {
                membersList.innerHTML = '';
                group.members.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'member-item';
                    memberDiv.innerHTML = `
                        <span class="member-name">${member.name}</span>
                        <span class="member-role">${member.role === 'admin' ? '管理员' : '成员'}</span>
                    `;
                    membersList.appendChild(memberDiv);
                });
            }
        } else {
            if (currentGroupSection) currentGroupSection.style.display = 'none';
            if (noGroupSection) noGroupSection.style.display = 'block';
        }
    });
}

// Twitter登录功能
function loginWithTwitter() {
    // 显示登录中状态
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '登录中...';
    loginBtn.disabled = true;
    
    // 模拟Twitter登录过程
    setTimeout(() => {
        // 模拟获取Twitter用户信息
        const mockUsers = [
            {
                id: 'twitter_001',
                name: '张三',
                handle: '@zhangsan',
                avatar: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
                verified: true,
                loginTime: new Date().toISOString()
            },
            {
                id: 'twitter_002',
                name: '李四',
                handle: '@lisi',
                avatar: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
                verified: false,
                loginTime: new Date().toISOString()
            },
            {
                id: 'twitter_003',
                name: '王五',
                handle: '@wangwu',
                avatar: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
                verified: true,
                loginTime: new Date().toISOString()
            }
        ];
        
        // 随机选择一个用户
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        
        // 保存用户信息
        chrome.storage.local.set({ 'twitterUser': randomUser }, () => {
            loadUserAuth();
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
            alert(`登录成功！欢迎 ${randomUser.name} (${randomUser.handle})`);
        });
    }, 1500);
}

// 登出功能
function logoutFromTwitter() {
    chrome.storage.local.remove(['twitterUser'], () => {
        loadUserAuth();
        alert('已成功登出');
    });
}

// 加载用户登录状态
function loadUserAuth() {
    const userInfoSection = document.getElementById('userInfoSection');
    const loginSection = document.getElementById('loginSection');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userHandle = document.getElementById('userHandle');

    chrome.storage.local.get(['twitterUser'], (result) => {
        if (result.twitterUser) {
            const user = result.twitterUser;
            if (userAvatar) userAvatar.src = user.avatar;
            if (userName) userName.textContent = user.name;
            if (userHandle) userHandle.textContent = user.handle;
            
            if (userInfoSection) userInfoSection.style.display = 'block';
            if (loginSection) loginSection.style.display = 'none';
        } else {
            if (userInfoSection) userInfoSection.style.display = 'none';
            if (loginSection) loginSection.style.display = 'block';
        }
    });
}

// 显示详细查看弹窗
function showDetailModal(type) {
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('detailModalTitle');
    const modalBody = document.getElementById('detailModalBody');
    
    let title = '';
    let items = [];
    
    switch(type) {
        case 'replies':
            title = '所有幽灵回复';
            items = getAllReplies();
            break;
        case 'replies-today':
            title = '今日幽灵回复';
            items = getTodayReplies();
            break;
        case 'retweets':
            title = '所有幽灵转帖';
            items = getAllRetweets();
            break;
        case 'retweets-today':
            title = '今日幽灵转帖';
            items = getTodayRetweets();
            break;
        case 'likes':
            title = '所有幽灵收藏';
            items = getAllLikes();
            break;
        case 'likes-today':
            title = '今日幽灵收藏';
            items = getTodayLikes();
            break;
    }
    
    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    
    if (items.length === 0) {
        modalBody.innerHTML = '<div style="text-align: center; padding: 20px; color: #536471;">暂无数据</div>';
    } else {
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'detail-item';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'detail-item-header';
            
            if (item.author && item.author.avatar) {
                const avatarImg = document.createElement('img');
                avatarImg.src = item.author.avatar;
                avatarImg.className = 'detail-item-avatar';
                headerDiv.appendChild(avatarImg);
            }
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'detail-item-info';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'detail-item-name';
            nameSpan.textContent = item.author ? item.author.name : '匿名用户';
            
            const handleSpan = document.createElement('span');
            handleSpan.className = 'detail-item-handle';
            if (item.author && item.author.handle) {
                handleSpan.textContent = item.author.handle;
            }
            
            const timeSpan = document.createElement('div');
            timeSpan.className = 'detail-item-time';
            timeSpan.textContent = formatTimeAgo(new Date(item.timestamp));
            
            infoDiv.appendChild(nameSpan);
            if (handleSpan.textContent) {
                infoDiv.appendChild(handleSpan);
            }
            infoDiv.appendChild(timeSpan);
            
            headerDiv.appendChild(infoDiv);
            itemDiv.appendChild(headerDiv);
            
            if (item.text) {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'detail-item-content';
                contentDiv.textContent = item.text;
                itemDiv.appendChild(contentDiv);
            }
            
            if (item.tweetId) {
                const linkDiv = document.createElement('a');
                linkDiv.className = 'detail-item-tweet-link';
                linkDiv.href = `https://twitter.com/i/status/${item.tweetId}`;
                linkDiv.target = '_blank';
                linkDiv.textContent = '查看原推文';
                itemDiv.appendChild(linkDiv);
            }
            
            modalBody.appendChild(itemDiv);
        });
    }
    
    modal.style.display = 'block';
}

// 获取所有回复
function getAllReplies() {
    let allReplies = [];
    chrome.storage.local.get(null, (result) => {
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-reply-')) {
                const replies = result[key] || [];
                replies.forEach(reply => {
                    allReplies.push({
                        ...reply,
                        tweetId: key.replace('ghost-reply-', ''),
                        type: 'reply'
                    });
                });
            }
        });
    });
    return allReplies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// 获取今日回复
function getTodayReplies() {
    const today = new Date().toDateString();
    return getAllReplies().filter(reply => 
        new Date(reply.timestamp).toDateString() === today
    );
}

// 获取所有转帖
function getAllRetweets() {
    let allRetweets = [];
    chrome.storage.local.get(null, (result) => {
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-retweet-')) {
                const retweets = result[key] || [];
                retweets.forEach(retweet => {
                    allRetweets.push({
                        ...retweet,
                        tweetId: key.replace('ghost-retweet-', ''),
                        type: 'retweet'
                    });
                });
            }
        });
    });
    return allRetweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// 获取今日转帖
function getTodayRetweets() {
    const today = new Date().toDateString();
    return getAllRetweets().filter(retweet => 
        new Date(retweet.timestamp).toDateString() === today
    );
}

// 获取所有收藏
function getAllLikes() {
    let allLikes = [];
    chrome.storage.local.get(null, (result) => {
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-like-')) {
                const likes = result[key] || [];
                likes.forEach(like => {
                    allLikes.push({
                        ...like,
                        tweetId: key.replace('ghost-like-', ''),
                        type: 'like'
                    });
                });
            }
        });
    });
    return allLikes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// 获取今日收藏
function getTodayLikes() {
    const today = new Date().toDateString();
    return getAllLikes().filter(like => 
        new Date(like.timestamp).toDateString() === today
    );
}

// 加载幽灵动态
function loadGhostFeed() {
    const feedContainer = document.getElementById('ghostFeed');
    if (!feedContainer) return;
    
    chrome.storage.local.get(null, (result) => {
        let feedItems = [];
        
        // 收集所有幽灵操作
        Object.keys(result).forEach(key => {
            if (key.startsWith('ghost-reply-') || key.startsWith('ghost-retweet-') || key.startsWith('ghost-like-')) {
                const items = result[key] || [];
                const tweetId = key.replace(/^ghost-(reply|retweet|like)-/, '');
                const type = key.includes('reply') ? 'reply' : key.includes('retweet') ? 'retweet' : 'like';
                
                items.forEach(item => {
                    feedItems.push({
                        ...item,
                        tweetId: tweetId,
                        type: type
                    });
                });
            }
        });
        
        // 按时间排序
        feedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 只显示最近20条
        feedItems = feedItems.slice(0, 20);
        
        if (feedItems.length === 0) {
            feedContainer.innerHTML = '<div class="feed-empty">暂无幽灵动态</div>';
            return;
        }
        
        feedContainer.innerHTML = '';
        
        feedItems.forEach(item => {
            const feedItem = document.createElement('div');
            feedItem.className = `feed-item ${item.type}`;
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'feed-item-header';
            
            if (item.author && item.author.avatar) {
                const avatarImg = document.createElement('img');
                avatarImg.src = item.author.avatar;
                avatarImg.className = 'feed-item-avatar';
                headerDiv.appendChild(avatarImg);
            }
            
            const authorSpan = document.createElement('span');
            authorSpan.className = 'feed-item-author';
            authorSpan.textContent = item.author ? item.author.name : '匿名用户';
            
            const handleSpan = document.createElement('span');
            handleSpan.className = 'feed-item-handle';
            if (item.author && item.author.handle) {
                handleSpan.textContent = item.author.handle;
            }
            
            const actionSpan = document.createElement('span');
            actionSpan.className = 'feed-item-action';
            switch(item.type) {
                case 'reply':
                    actionSpan.textContent = '回复了';
                    break;
                case 'retweet':
                    actionSpan.textContent = '转帖了';
                    break;
                case 'like':
                    actionSpan.textContent = '收藏了';
                    break;
            }
            
            headerDiv.appendChild(authorSpan);
            if (handleSpan.textContent) {
                headerDiv.appendChild(handleSpan);
            }
            headerDiv.appendChild(actionSpan);
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'feed-item-time';
            timeDiv.textContent = formatTimeAgo(new Date(item.timestamp));
            
            feedItem.appendChild(headerDiv);
            feedItem.appendChild(timeDiv);
            
            if (item.text) {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'feed-item-content';
                contentDiv.textContent = item.text;
                feedItem.appendChild(contentDiv);
            }
            
            feedContainer.appendChild(feedItem);
        });
    });
}

// 格式化时间为相对时间
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

// ==================== 信息流总结功能 ====================

// 生成信息流总结
async function generateFeedSummary() {
    const summaryBtn = document.getElementById('generateSummary');
    const summaryContent = document.getElementById('summaryContent');
    
    if (!summaryBtn || !summaryContent) return;
    
    // 显示加载状态
    const originalText = summaryBtn.textContent;
    summaryBtn.textContent = '分析中...';
    summaryBtn.disabled = true;
    
    summaryContent.innerHTML = '<div class="summary-loading">正在分析您近2小时的推文内容...</div>';
    
    try {
        // 获取近2小时的推文数据
        const tweets = await getRecentTweets();
        
        if (tweets.length === 0) {
            summaryContent.innerHTML = '<div class="summary-empty">近2小时内没有检测到推文内容</div>';
            return;
        }
        
        // 分析推文内容
        const analysis = await analyzeTweets(tweets);
        
        // 显示分析结果
        displaySummary(analysis);
        
    } catch (error) {
        console.error('生成总结失败:', error);
        summaryContent.innerHTML = '<div class="summary-empty">生成总结失败，请重试</div>';
    } finally {
        summaryBtn.textContent = originalText;
        summaryBtn.disabled = false;
    }
}

// 获取近2小时的推文数据
async function getRecentTweets() {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
            const tweets = [];
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            
            Object.keys(result).forEach(key => {
                if (key.startsWith('viewed-tweet-')) {
                    const tweetData = result[key];
                    if (new Date(tweetData.timestamp) > twoHoursAgo) {
                        tweets.push(tweetData);
                    }
                }
            });
            
            resolve(tweets);
        });
    });
}

// 分析推文内容
async function analyzeTweets(tweets) {
    const analysis = {
        totalTweets: tweets.length,
        timeRange: getTimeRange(tweets),
        topics: extractTopics(tweets),
        sentiments: analyzeSentiments(tweets),
        insights: generateInsights(tweets),
        topAuthors: getTopAuthors(tweets),
        engagement: calculateEngagement(tweets)
    };
    
    return analysis;
}

// 获取时间范围
function getTimeRange(tweets) {
    if (tweets.length === 0) return { start: null, end: null };
    
    const timestamps = tweets.map(t => new Date(t.timestamp));
    return {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps))
    };
}

// 提取主题
function extractTopics(tweets) {
    const topicCounts = {};
    const stopWords = new Set(['的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '和', '与', '或', '但', '因为', '所以', '如果', '虽然', '但是', '然后', '现在', '今天', '昨天', '明天', '年', '月', '日', '时', '分', '秒', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
    
    tweets.forEach(tweet => {
        const text = tweet.text || '';
        const words = text.toLowerCase()
            .replace(/[^\w\u4e00-\u9fff\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !stopWords.has(word));
        
        words.forEach(word => {
            topicCounts[word] = (topicCounts[word] || 0) + 1;
        });
    });
    
    return Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));
}

// 分析情感
function analyzeSentiments(tweets) {
    const positiveWords = ['好', '棒', '赞', '喜欢', '爱', '开心', '高兴', '兴奋', 'amazing', 'great', 'awesome', 'love', 'like', 'happy', 'excited'];
    const negativeWords = ['坏', '差', '讨厌', '恨', '难过', '伤心', '愤怒', '失望', 'bad', 'terrible', 'hate', 'sad', 'angry', 'disappointed'];
    
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    tweets.forEach(tweet => {
        const text = (tweet.text || '').toLowerCase();
        const positiveCount = positiveWords.filter(word => text.includes(word)).length;
        const negativeCount = negativeWords.filter(word => text.includes(word)).length;
        
        if (positiveCount > negativeCount) {
            positive++;
        } else if (negativeCount > positiveCount) {
            negative++;
        } else {
            neutral++;
        }
    });
    
    return { positive, negative, neutral };
}

// 生成洞察
function generateInsights(tweets) {
    const insights = [];
    
    // 活跃度分析
    const hourlyActivity = {};
    tweets.forEach(tweet => {
        const hour = new Date(tweet.timestamp).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    
    const mostActiveHour = Object.entries(hourlyActivity)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (mostActiveHour) {
        insights.push(`您在${mostActiveHour[0]}点最活跃，浏览了${mostActiveHour[1]}条推文`);
    }
    
    // 内容类型分析
    const hasImages = tweets.filter(t => t.hasImages).length;
    const hasLinks = tweets.filter(t => t.hasLinks).length;
    
    if (hasImages > tweets.length * 0.3) {
        insights.push('您浏览的内容中图片推文占比较高');
    }
    
    if (hasLinks > tweets.length * 0.4) {
        insights.push('您浏览的内容中链接推文占比较高');
    }
    
    // 互动分析
    const avgEngagement = tweets.reduce((sum, t) => sum + (t.likes || 0) + (t.retweets || 0), 0) / tweets.length;
    if (avgEngagement > 100) {
        insights.push('您浏览的内容整体互动度较高');
    }
    
    return insights;
}

// 获取热门作者
function getTopAuthors(tweets) {
    const authorCounts = {};
    
    tweets.forEach(tweet => {
        if (tweet.author) {
            const authorKey = tweet.author.handle || tweet.author.name;
            if (authorKey) {
                authorCounts[authorKey] = (authorCounts[authorKey] || 0) + 1;
            }
        }
    });
    
    return Object.entries(authorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([author, count]) => ({ author, count }));
}

// 计算互动度
function calculateEngagement(tweets) {
    const totalLikes = tweets.reduce((sum, t) => sum + (t.likes || 0), 0);
    const totalRetweets = tweets.reduce((sum, t) => sum + (t.retweets || 0), 0);
    const totalReplies = tweets.reduce((sum, t) => sum + (t.replies || 0), 0);
    
    return {
        totalLikes,
        totalRetweets,
        totalReplies,
        avgEngagement: (totalLikes + totalRetweets + totalReplies) / tweets.length
    };
}

// 显示总结结果
function displaySummary(analysis) {
    const summaryContent = document.getElementById('summaryContent');
    
    const html = `
        <div class="summary-result">
            <div class="summary-stats">
                <div class="summary-stat">
                    <span class="summary-stat-number">${analysis.totalTweets}</span>
                    <span class="summary-stat-label">总推文数</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-number">${analysis.topics.length}</span>
                    <span class="summary-stat-label">主要话题</span>
                </div>
                <div class="summary-stat">
                    <span class="summary-stat-number">${analysis.topAuthors.length}</span>
                    <span class="summary-stat-label">关注作者</span>
                </div>
            </div>
            
            <div class="summary-topics">
                <div class="summary-topic-title">🔥 热门话题</div>
                <div class="summary-topic-list">
                    ${analysis.topics.slice(0, 8).map(topic => 
                        `<span class="summary-topic-tag">${topic.topic} (${topic.count})</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="summary-insights">
                <div class="summary-insight-title">💡 智能洞察</div>
                <div class="summary-insight-list">
                    ${analysis.insights.map(insight => 
                        `<div class="summary-insight-item">${insight}</div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="summary-timeline">
                分析时间范围: ${formatTimeRange(analysis.timeRange)}
            </div>
        </div>
    `;
    
    summaryContent.innerHTML = html;
}

// 格式化时间范围
function formatTimeRange(timeRange) {
    if (!timeRange.start || !timeRange.end) return '无数据';
    
    const start = timeRange.start.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const end = timeRange.end.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `${start} - ${end}`;
}
