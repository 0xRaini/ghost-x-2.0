// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const ghostModeToggle = document.getElementById('ghostModeToggle');
    const filterKeywordInput = document.getElementById('filterKeyword');
    const status = document.getElementById('status');
    
    // 获取其他DOM元素（可能为null）
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
    
    // 更新toggle标签
    const toggleLabel = document.getElementById('toggleLabel');
    if (toggleLabel) {
        toggleLabel.textContent = enabled ? '开启' : '关闭';
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
    const groupNameInput = document.getElementById('groupNameInput');
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
    const groupNameInput = document.getElementById('groupNameInput');
    const inviteCode = groupNameInput ? groupNameInput.value.trim().toUpperCase() : '';
    
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
        const groupMembersSection = document.getElementById('groupMembersSection');
        const groupNameSpan = document.getElementById('currentGroupName');
        const inviteCodeSpan = document.getElementById('currentGroupCode');
        const membersList = document.getElementById('membersList');
        
        if (result.currentGroup) {
            const group = result.currentGroup;
            
            if (currentGroupSection) currentGroupSection.style.display = 'block';
            if (groupMembersSection) groupMembersSection.style.display = 'block';
            
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
            if (groupMembersSection) groupMembersSection.style.display = 'none';
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

// 获取当前用户信息
function getCurrentUser(callback) {
    chrome.storage.local.get(['twitterUser'], (result) => {
        if (callback) {
            callback(result.twitterUser || null);
        }
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
    
    const displayItems = (items) => {
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
    }
    
    // 根据类型调用相应的函数
    switch(type) {
        case 'replies':
            title = '所有幽灵回复';
            getAllReplies(displayItems);
            break;
        case 'replies-today':
            title = '今日幽灵回复';
            getTodayReplies(displayItems);
            break;
        case 'retweets':
            title = '所有幽灵转帖';
            getAllRetweets(displayItems);
            break;
        case 'retweets-today':
            title = '今日幽灵转帖';
            getTodayRetweets(displayItems);
            break;
        case 'likes':
            title = '所有幽灵收藏';
            getAllLikes(displayItems);
            break;
        case 'likes-today':
            title = '今日幽灵收藏';
            getTodayLikes(displayItems);
            break;
    }
    
    modal.style.display = 'block';
}

// 获取所有回复
function getAllReplies(callback) {
    chrome.storage.local.get(null, (result) => {
        let allReplies = [];
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
        const sortedReplies = allReplies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (callback) callback(sortedReplies);
    });
}

// 获取今日回复
function getTodayReplies(callback) {
    getAllReplies((allReplies) => {
        const today = new Date().toDateString();
        const todayReplies = allReplies.filter(reply => 
            new Date(reply.timestamp).toDateString() === today
        );
        if (callback) callback(todayReplies);
    });
}

// 获取所有转帖
function getAllRetweets(callback) {
    chrome.storage.local.get(null, (result) => {
        let allRetweets = [];
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
        const sortedRetweets = allRetweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (callback) callback(sortedRetweets);
    });
}

// 获取今日转帖
function getTodayRetweets(callback) {
    getAllRetweets((allRetweets) => {
        const today = new Date().toDateString();
        const todayRetweets = allRetweets.filter(retweet => 
            new Date(retweet.timestamp).toDateString() === today
        );
        if (callback) callback(todayRetweets);
    });
}

// 获取所有收藏
function getAllLikes(callback) {
    chrome.storage.local.get(null, (result) => {
        let allLikes = [];
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
        const sortedLikes = allLikes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (callback) callback(sortedLikes);
    });
}

// 获取今日收藏
function getTodayLikes(callback) {
    getAllLikes((allLikes) => {
        const today = new Date().toDateString();
        const todayLikes = allLikes.filter(like => 
            new Date(like.timestamp).toDateString() === today
        );
        if (callback) callback(todayLikes);
    });
}

// 加载幽灵动态
function loadGhostFeed() {
    const feedContainer = document.getElementById('ghostFeed');
    if (!feedContainer) return;
    
    chrome.storage.local.get(null, (result) => {
        let feedItems = [];
        
        // 收集所有幽灵操作（回复、转帖、收藏）
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
        
        // 按时间排序（最新的在前）
        feedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 显示最近20条
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
