import express from 'express';
import watchPartyService from '../services/watchPartyService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/watch-party/create:
 *   post:
 *     summary: Create a new watch party
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *             properties:
 *               movieId:
 *                 type: integer
 *               title:
 *                 type: string
 *               maxParticipants:
 *                 type: integer
 *                 default: 10
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Party created successfully
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { movieId, title, maxParticipants, isPublic, scheduledTime } = req.body;
    const hostUserId = req.user.id;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }

    const party = await watchPartyService.createParty(hostUserId, movieId, {
      title,
      maxParticipants,
      isPublic,
      scheduledTime
    });

    res.json({ success: true, data: party });
  } catch (error) {
    console.error('Create party error:', error);
    res.status(500).json({ success: false, message: 'Failed to create watch party' });
  }
});

/**
 * @swagger
 * /api/watch-party/join/{partyCode}:
 *   post:
 *     summary: Join a watch party
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined party successfully
 */
router.post('/join/:partyCode', authenticateToken, async (req, res) => {
  try {
    const { partyCode } = req.params;
    const userId = req.user.id;

    const party = await watchPartyService.joinParty(partyCode, userId);

    res.json({ success: true, data: party });
  } catch (error) {
    console.error('Join party error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}:
 *   get:
 *     summary: Get party details
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Party details
 */
router.get('/:partyId', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const details = await watchPartyService.getPartyDetails(parseInt(partyId));

    res.json({ success: true, data: details });
  } catch (error) {
    console.error('Get party details error:', error);
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/watch-party/code/{partyCode}:
 *   get:
 *     summary: Get party by code
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party details
 */
router.get('/code/:partyCode', authenticateToken, async (req, res) => {
  try {
    const { partyCode } = req.params;
    const party = await watchPartyService.getPartyByCode(partyCode);

    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    const details = await watchPartyService.getPartyDetails(party.id);
    res.json({ success: true, data: details });
  } catch (error) {
    console.error('Get party by code error:', error);
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/messages:
 *   get:
 *     summary: Get party messages
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Party messages
 */
router.get('/:partyId/messages', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const { limit = 100, before } = req.query;

    const messages = await watchPartyService.getMessages(
      parseInt(partyId),
      parseInt(limit),
      before ? parseInt(before) : null
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/message:
 *   post:
 *     summary: Send a message
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [chat, reaction]
 *     responses:
 *       200:
 *         description: Message sent
 */
router.post('/:partyId/message', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const { message, messageType = 'chat' } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const sentMessage = await watchPartyService.sendMessage(
      parseInt(partyId),
      userId,
      message,
      messageType
    );

    res.json({ success: true, data: sentMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/start:
 *   post:
 *     summary: Start the watch party
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Party started
 */
router.post('/:partyId/start', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const hostUserId = req.user.id;

    await watchPartyService.startParty(parseInt(partyId), hostUserId);

    res.json({ success: true, message: 'Party started' });
  } catch (error) {
    console.error('Start party error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/pause:
 *   post:
 *     summary: Pause the watch party
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Party paused
 */
router.post('/:partyId/pause', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const hostUserId = req.user.id;

    await watchPartyService.pauseParty(parseInt(partyId), hostUserId);

    res.json({ success: true, message: 'Party paused' });
  } catch (error) {
    console.error('Pause party error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/end:
 *   post:
 *     summary: End the watch party
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Party ended
 */
router.post('/:partyId/end', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const hostUserId = req.user.id;

    await watchPartyService.endParty(parseInt(partyId), hostUserId);

    res.json({ success: true, message: 'Party ended' });
  } catch (error) {
    console.error('End party error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/leave:
 *   post:
 *     summary: Leave a watch party
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Left party
 */
router.post('/:partyId/leave', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const userId = req.user.id;

    await watchPartyService.leaveParty(parseInt(partyId), userId);

    res.json({ success: true, message: 'Left party' });
  } catch (error) {
    console.error('Leave party error:', error);
    res.status(500).json({ success: false, message: 'Failed to leave party' });
  }
});

/**
 * @swagger
 * /api/watch-party/user/parties:
 *   get:
 *     summary: Get user's parties
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's parties
 */
router.get('/user/parties', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const parties = await watchPartyService.getUserParties(userId);
    res.json({ success: true, data: parties });
  } catch (error) {
    console.error('Get user parties error:', error);
    res.status(500).json({ success: false, message: 'Failed to get parties' });
  }
});

/**
 * @swagger
 * /api/watch-party/public/list:
 *   get:
 *     summary: Get public parties
 *     tags: [Watch Party]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Public parties
 */
router.get('/public/list', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const parties = await watchPartyService.getPublicParties(parseInt(limit));
    res.json({ success: true, data: parties });
  } catch (error) {
    console.error('Get public parties error:', error);
    res.status(500).json({ success: false, message: 'Failed to get public parties' });
  }
});

/**
 * @swagger
 * /api/watch-party/{partyId}/playback:
 *   post:
 *     summary: Update playback state
 *     tags: [Watch Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentTime:
 *                 type: number
 *               isPlaying:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Playback state updated
 */
router.post('/:partyId/playback', authenticateToken, async (req, res) => {
  try {
    const { partyId } = req.params;
    const { currentTime, isPlaying } = req.body;
    const userId = req.user.id;

    await watchPartyService.updatePlaybackState(
      parseInt(partyId),
      userId,
      currentTime,
      isPlaying
    );

    res.json({ success: true, message: 'Playback state updated' });
  } catch (error) {
    console.error('Update playback error:', error);
    res.status(500).json({ success: false, message: 'Failed to update playback' });
  }
});

export default router;
