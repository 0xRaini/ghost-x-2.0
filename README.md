# Ghost X 2.0

> A parallel, user-controlled distribution layer for Twitter/X

**[中文文档](README.zh-CN.md)** | **[Documentation](本地预览指南.md)** | **[Changelog](CHANGELOG.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## 💡 Project Vision

In today's social media landscape, **content distribution control is entirely in the hands of platforms**.

Algorithms decide what content gets pushed to you, how many people hear your voice, and even what you can or cannot see. This centralized control model has gradually stripped users of control over their own social experience.

Ghost X was born from a simple yet bold idea:

> **What if we could create a parallel distribution layer controlled by users themselves?**

Imagine:
- Having "ghost conversations" with like-minded friends outside the public timeline
- Building exclusive circles where you share thoughts visible only to members
- Freely filtering content without algorithmic interference
- Keeping all interaction data stored locally, untracked and unanalyzed by platforms

This isn't about fighting platforms—it's about **building a user-autonomous social network layer on top of existing platforms**. Like a "ghost," it exists within the original system yet operates with independent logic.

Ghost X is an experimental exploration of decentralized social networking and a practice of the belief that "users should own their data and social relationships."

---

## 🎯 Overview

Ghost X is an innovative Chrome extension that provides a parallel, user-controlled distribution layer for Twitter/X. It allows users to create "ghost" content on Twitter that's only visible to other extension users, achieving true decentralized social media experience.

### Core Principles
- **User Sovereignty**: Your data, your control
- **Decentralization**: No reliance on platform servers, peer-to-peer interaction
- **Privacy First**: All data stored locally, nothing uploaded to servers
- **Open & Transparent**: Fully open-source, community-audited code
- **Free Communication**: Create private social spaces free from algorithmic interference

---

## 🌟 Why Choose Ghost X

### Comparison with Other Solutions

| Feature | Ghost X | Traditional Social Media | Mastodon/Decentralized Platforms |
|---------|---------|--------------------------|----------------------------------|
| **Data Control** | ✅ Fully Local | ❌ Platform Owned | ✅ Server-side Control |
| **Algorithm Transparency** | ✅ No Algorithm | ❌ Black Box | ✅ Transparent Timeline |
| **Migration Cost** | ✅ Zero (Use on existing platform) | ❌ High (Need to migrate social graph) | ⚠️ Medium (New account required) |
| **User Base** | ✅ Existing Twitter users | ✅ Massive | ⚠️ Relatively niche |
| **Technical Barrier** | ✅ One-click install | ✅ Simple | ⚠️ Server selection required |
| **Privacy Protection** | ✅ Local encryption | ❌ Data collection | ✅ Server-side encryption |
| **Content Moderation** | ✅ User-defined | ❌ Platform rules | ⚠️ Server rules |

### Ghost X's Unique Advantages

**🎯 Seamless Integration**
- No need to leave Twitter—use it directly on the existing platform
- Maintain your existing social network
- Enjoy both public and private social experiences simultaneously

**🔒 Privacy First**
- All ghost content stored completely locally
- No reliance on any centralized servers
- No data collection or uploads whatsoever

**👥 Community-Driven**
- Group feature lets you build exclusive social circles
- Invite code mechanism ensures member quality
- Only extension users can participate in ghost interactions

**⚡ Zero Learning Curve**
- Interface perfectly mimics Twitter's native experience
- Familiar interaction patterns, no relearning required
- One-click install, instant use

**🛠️ Extensibility**
- Open-source code, community contributions welcome
- Modular design, easy to add new features
- Future support for more social platforms

---

## ✨ Core Features

### 1. 🔍 Ghost Mode Filtering
- **Smart Filtering**: Display only tweets containing specified keywords
- **Real-time Application**: Settings apply instantly to current page
- **Case Insensitive**: Supports fuzzy matching
- **Status Indicator**: Clear display of current filter status

### 2. 💬 Ghost Reply System
- **Private Replies**: Add replies under tweets visible only to extension users
- **280 Character Limit**: Fully compatible with Twitter's character limit
- **Live Counter**: Real-time display of character usage
- **Identity Support**: Support for anonymous, Twitter identity, or group identity replies
- **Time Display**: Smart relative time display (e.g., "2 minutes ago")
- **Delete Management**: Support for deleting individual replies
- **Statistics**: View total reply count and today's reply count

### 3. 🔄 Ghost Retweet Feature
- **Virtual Retweets**: Retweet operations in ghost layer without actually retweeting on Twitter
- **Identity Display**: Shows retweeter info and group affiliation
- **Statistics Management**: View total and daily retweet counts
- **Batch Clear**: Support for clearing all retweet records

### 4. ❤️ Ghost Like Feature
- **Virtual Likes**: Like operations in ghost layer without actually liking on Twitter
- **Identity Display**: Shows liker info and group affiliation
- **Statistics Management**: View total and daily like counts
- **Batch Clear**: Support for clearing all like records

### 5. 👤 Twitter Identity Login
- **One-click Login**: Simulated Twitter login process
- **User Profile**: Display username, avatar, and verification status
- **Identity Replies**: Ghost replies show real Twitter identity after login
- **Logout Function**: Can log out current account at any time

### 6. 👥 Group Management System
- **Create Groups**: Enter group name to create
- **Join Groups**: Use 6-digit invite code to join groups
- **Invite Code System**: Automatically generates unique invite codes
- **Member Management**: Display group member list and roles
- **Group Replies**: Group members can see each other's ghost replies
- **Permission Management**: Admin and member role distinction

### 7. 📊 Data Statistics & Management
- **Real-time Stats**: Display total and daily counts for replies, retweets, and likes
- **Detailed View**: Click stats numbers to view detailed content
- **Batch Management**: Support for clearing all data
- **Data Export**: All data saved in local Chrome storage

---

## 🚀 Quick Start

### Prerequisites
- Chrome Browser (supporting Manifest V3)
- Access to Twitter/X website

### Installation

1. **Download the project**
   ```bash
   git clone https://github.com/0xRaini/ghost-x-2.0.git
   cd ghost-x-2.0
   ```

2. **Load the extension**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select the project folder

3. **Verify installation**
   - Check if Ghost X icon appears in browser toolbar
   - Visit Twitter/X website to test features

---

## 📖 Usage Guide

### Ghost Mode Filtering

1. Click the Ghost X icon in browser toolbar
2. Toggle "Ghost Mode" switch
3. Enter filtering keyword in "Filter Keyword" input box
4. Only tweets containing that keyword will be displayed
5. Disable ghost mode to display all tweets

### Ghost Reply Feature

1. Find "👻 Ghost Reply (Extension users only)" area under any tweet
2. Enter reply content in text box (max 280 characters)
3. View real-time character count
4. Click "Send" button to publish reply
5. Click "Clear" button to clear input box
6. Click "Delete" in reply list to remove individual replies

### Ghost Retweet Feature

1. Click "🔄 Ghost Retweet" button in ghost reply area
2. Retweet operation saved locally
3. Retweet records displayed in "🔄 Ghost Retweets" area under tweet
4. Supports Twitter identity and group identity retweets

### Ghost Like Feature

1. Click "❤️ Ghost Like" button in ghost reply area
2. Like operation saved locally
3. Like records displayed in "❤️ Ghost Likes" area under tweet
4. Supports Twitter identity and group identity likes

### Group Feature

**Creating a Group**
1. Enter group name in popup interface
2. Click "Create Group" button
3. System generates 6-digit invite code

**Joining a Group**
1. Enter 6-digit invite code
2. Click "Join Group" button
3. Group info displayed after successful join

**Group Management**
- View group member list
- Copy invite code to share with other users
- Click "Leave Group" to exit group

---

## 🏗️ Project Structure

```
ghost-x-2.0/
├── manifest.json              # Extension config (Manifest V3)
├── content.js                 # Content script - Core functionality (1,300+ lines)
├── popup.html                 # Popup interface
├── popup.js                   # Popup logic (933 lines)
├── images/                    # Icon resources
│   ├── icon16.png            # 16x16 icon ✅
│   ├── icon48.png            # 48x48 icon ✅
│   ├── icon128.png           # 128x128 icon ✅
│   └── icon.svg              # SVG vector icon
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
├── README.md                 # This file
├── README.zh-CN.md           # Chinese documentation
└── CHANGELOG.md              # Version history
```

### Core Files

**manifest.json**
- Chrome extension configuration manifest
- Defines permissions, content scripts, icons, etc.
- Uses Manifest V3 latest standard

**content.js** (Core)
- Content script injected into Twitter/X pages
- Contains all ghost feature implementation logic
- Uses MutationObserver for real-time page change monitoring
- Main modules:
  - Tweet processing & filtering
  - Ghost reply system
  - Ghost retweet/like
  - Data storage & validation
  - Error handling

**popup.html / popup.js**
- Extension popup interface and logic
- Settings management
- Statistics display
- Group management
- User authentication

---

## 🔧 Technical Features

### Tech Stack
- **Manifest V3**: Latest Chrome extension standard
- **Chrome Storage API**: Local data storage and management
- **MutationObserver**: Real-time DOM change monitoring
- **Chrome Identity API**: User identity management
- **OAuth 2.0**: Secure authentication process

### Architecture
- **Responsive Design**: Adapts to different screen sizes
- **Modular Architecture**: Independent feature modules, easy to maintain
- **Async Processing**: Non-blocking user experience
- **Error Handling**: Comprehensive error handling mechanisms
- **Data Persistence**: Local storage, data security

### Performance Optimization
- **Lazy Loading**: Load feature modules on demand
- **Duplicate Prevention**: Avoid processing same tweets repeatedly
- **Memory Management**: Timely cleanup of unnecessary data
- **Caching Mechanism**: Smart caching improves performance

---

## 🐛 Known Issues

### Current Version Issues
1. **Ghost Mode Toggle**: Selector errors causing toggle malfunction
2. **Group Features**: Some ID mismatches causing feature anomalies
3. **Twitter Login**: Currently simulated login, real OAuth not implemented

### Fix Status
- ✅ Async function race conditions fixed
- ✅ Status display styling optimized
- ❌ DOM selector issues pending fix
- ❌ Group feature ID mismatches pending fix

---

## 🚀 Future Vision

Ghost X is more than just a browser extension—it represents our vision for the future of social networking.

### Short-term Goals (3-6 months)
- ✅ Perfect core feature stability
- 🔄 Implement real Twitter OAuth authentication
- 🌐 Build decentralized data sync protocol
- 🔐 Implement end-to-end encryption
- 📱 Optimize mobile compatibility

### Medium-term Goals (6-12 months)
- 🌍 Support more social platforms (Mastodon, Bluesky, Threads)
- 🤝 Establish cross-platform ghost network
- 🔗 Develop decentralized identity system (DID)
- 💼 Create community governance mechanism
- 📊 Develop data analysis and insights tools

### Long-term Vision
- 🌐 **Build truly decentralized social protocol**
  - No reliance on any single platform
  - Users fully own their data
  - Seamless cross-platform interoperability

- 🔓 **Promote social media democratization**
  - Break algorithmic monopoly control
  - Return content distribution rights to users
  - Create truly open social ecosystem

- 🤝 **Foster healthy community culture**
  - Deep communication within small circles
  - Reduce filter bubble effects
  - Promote rational discussion and thought exchange

---

## 🤝 Join Us

Ghost X is a community-driven open-source project. We welcome all forms of contributions!

### How to Participate

**🐛 Report Issues**
- Submit bug reports on [GitHub Issues](https://github.com/0xRaini/ghost-x-2.0/issues)
- Describe problems and reproduction steps in detail
- Include browser version and error screenshots

**💡 Suggest Features**
- Share your ideas and suggestions
- Participate in feature discussions and voting
- Help improve product roadmap

**👨‍💻 Contribute Code**
1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

**📖 Improve Documentation**
- Improve README and usage docs
- Translate into other languages
- Write tutorials and best practices

**🎨 Design Contributions**
- Improve UI/UX design
- Create promotional materials
- Design icons and visual elements

### Code Standards
- Follow existing code style
- Add necessary comments (English or Chinese)
- Ensure new features have complete error handling
- Test before submitting

---

## 📞 Contact

### Project Links
- **GitHub Repository**: [github.com/0xRaini/ghost-x-2.0](https://github.com/0xRaini/ghost-x-2.0)
- **Issue Tracker**: [GitHub Issues](https://github.com/0xRaini/ghost-x-2.0/issues)
- **Discussion Forum**: [GitHub Discussions](https://github.com/0xRaini/ghost-x-2.0/discussions)

### Development Team
- **Project Creator**: [@0xRain](https://github.com/0xRain)
- **Core Contributors**: We're waiting for you to join!

### Resources
- **Development Guide**: See [本地预览指南.md](本地预览指南.md)
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Disclaimer
- This project is for learning and research purposes only
- Please comply with relevant laws and platform terms of service
- Developers are not responsible for any consequences of using this extension
- Twitter/X is a trademark of Twitter, Inc. This project has no official affiliation

---

## 💭 Final Words

Ghost X is an experiment and an exploration.

We believe that **social media should not be monopolized and controlled by a few companies**. Everyone should have the right to choose: what content to see, who to communicate with, and how to manage their own data.

This project may not be perfect and may face many challenges, but we believe this direction is right.

If you also agree with these principles, welcome to join us in building a more open, free, and user-friendly social network.

**Let's be the ghosts of social media together.** 👻

---

**Last Updated**: November 2024
**Current Version**: v2.0.3
**Status**: 🚧 Active Development
