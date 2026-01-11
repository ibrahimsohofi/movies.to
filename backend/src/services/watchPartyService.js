import { query, execute, getConnection } from '../config/database.js';
import crypto from 'crypto';

class WatchPartyService {

  /**
   * Generate a unique party code
   */
  generatePartyCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create a new watch party
   */
  async createParty(hostUserId, movieId, options = {}) {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const partyCode = this.generatePartyCode();
      const {
        title = null,
        maxParticipants = 10,
        isPublic = false,
        scheduledTime = null
      } = options;

      // Create the party
      const [result] = await connection.execute(`
        INSERT INTO watch_parties
        (host_user_id, movie_id, party_code, title, max_participants, is_public, scheduled_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [hostUserId, movieId, partyCode, title, maxParticipants, isPublic, scheduledTime]);

      const partyId = result.insertId;

      // Add host as first participant
      await connection.execute(`
        INSERT INTO watch_party_participants (party_id, user_id)
        VALUES (?, ?)
      `, [partyId, hostUserId]);

      // Initialize playback state
      await connection.execute(`
        INSERT INTO watch_party_playback_state (party_id, current_time, is_playing, updated_by)
        VALUES (?, 0, 0, ?)
      `, [partyId, hostUserId]);

      await connection.commit();

      return {
        id: partyId,
        partyCode,
        hostUserId,
        movieId,
        title,
        maxParticipants,
        isPublic
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Join an existing watch party
   */
  async joinParty(partyCode, userId) {
    // Get party details
    const parties = await query(`
      SELECT id, status, max_participants, host_user_id,
             (SELECT COUNT(*) FROM watch_party_participants WHERE party_id = watch_parties.id AND is_active = 1) as current_participants
      FROM watch_parties
      WHERE party_code = ?
    `, [partyCode]);

    if (parties.length === 0) {
      throw new Error('Party not found');
    }

    const party = parties[0];

    if (party.status === 'ended') {
      throw new Error('Party has ended');
    }

    if (party.current_participants >= party.max_participants) {
      throw new Error('Party is full');
    }

    // Add or reactivate participant
    await execute(`
      INSERT INTO watch_party_participants (party_id, user_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE is_active = 1, left_at = NULL, joined_at = CURRENT_TIMESTAMP
    `, [party.id, userId]);

    return party;
  }

  /**
   * Leave a watch party
   */
  async leaveParty(partyId, userId) {
    await execute(`
      UPDATE watch_party_participants
      SET is_active = 0, left_at = CURRENT_TIMESTAMP
      WHERE party_id = ? AND user_id = ?
    `, [partyId, userId]);
  }

  /**
   * Get party details with participants and playback state
   */
  async getPartyDetails(partyId) {
    const parties = await query(`
      SELECT
        wp.*,
        m.title as movie_title,
        m.poster_path,
        m.runtime,
        m.backdrop_path,
        m.overview,
        u.username as host_username,
        u.avatar_url as host_avatar
      FROM watch_parties wp
      LEFT JOIN movies m ON wp.movie_id = m.tmdb_id OR wp.movie_id = m.id
      JOIN users u ON wp.host_user_id = u.id
      WHERE wp.id = ?
    `, [partyId]);

    if (parties.length === 0) {
      throw new Error('Party not found');
    }

    const party = parties[0];

    // Get participants
    const participants = await query(`
      SELECT
        u.id,
        u.username,
        u.avatar_url,
        wpp.joined_at,
        wpp.is_active,
        CASE WHEN u.id = ? THEN 1 ELSE 0 END as is_host
      FROM watch_party_participants wpp
      JOIN users u ON wpp.user_id = u.id
      WHERE wpp.party_id = ? AND wpp.is_active = 1
      ORDER BY wpp.joined_at ASC
    `, [party.host_user_id, partyId]);

    // Get playback state
    const playbackState = await query(`
      SELECT current_time, is_playing, updated_at
      FROM watch_party_playback_state
      WHERE party_id = ?
    `, [partyId]);

    return {
      ...party,
      participants,
      playbackState: playbackState[0] || { current_time: 0, is_playing: false }
    };
  }

  /**
   * Get party by code
   */
  async getPartyByCode(partyCode) {
    const parties = await query(`
      SELECT * FROM watch_parties WHERE party_code = ?
    `, [partyCode]);

    return parties[0] || null;
  }

  /**
   * Update playback state
   */
  async updatePlaybackState(partyId, userId, currentTime, isPlaying) {
    await execute(`
      UPDATE watch_party_playback_state
      SET current_time = ?, is_playing = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE party_id = ?
    `, [currentTime, isPlaying ? 1 : 0, userId, partyId]);
  }

  /**
   * Send a message in a watch party
   */
  async sendMessage(partyId, userId, message, messageType = 'chat') {
    const result = await execute(`
      INSERT INTO watch_party_messages (party_id, user_id, message, message_type)
      VALUES (?, ?, ?, ?)
    `, [partyId, userId, message, messageType]);

    const messages = await query(`
      SELECT
        wpm.*,
        u.username,
        u.avatar_url
      FROM watch_party_messages wpm
      JOIN users u ON wpm.user_id = u.id
      WHERE wpm.id = ?
    `, [result.insertId]);

    return messages[0];
  }

  /**
   * Get messages for a party
   */
  async getMessages(partyId, limit = 100, before = null) {
    let sql = `
      SELECT
        wpm.*,
        u.username,
        u.avatar_url
      FROM watch_party_messages wpm
      JOIN users u ON wpm.user_id = u.id
      WHERE wpm.party_id = ?
    `;
    const params = [partyId];

    if (before) {
      sql += ' AND wpm.id < ?';
      params.push(before);
    }

    sql += ' ORDER BY wpm.created_at DESC LIMIT ?';
    params.push(limit);

    const messages = await query(sql, params);
    return messages.reverse();
  }

  /**
   * Start a watch party
   */
  async startParty(partyId, hostUserId) {
    // Verify the user is the host
    const parties = await query(`
      SELECT * FROM watch_parties WHERE id = ? AND host_user_id = ?
    `, [partyId, hostUserId]);

    if (parties.length === 0) {
      throw new Error('Only the host can start the party');
    }

    await execute(`
      UPDATE watch_parties
      SET status = 'active', started_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [partyId]);
  }

  /**
   * Pause a watch party
   */
  async pauseParty(partyId, hostUserId) {
    const parties = await query(`
      SELECT * FROM watch_parties WHERE id = ? AND host_user_id = ?
    `, [partyId, hostUserId]);

    if (parties.length === 0) {
      throw new Error('Only the host can pause the party');
    }

    await execute(`
      UPDATE watch_parties SET status = 'paused' WHERE id = ?
    `, [partyId]);

    await execute(`
      UPDATE watch_party_playback_state SET is_playing = 0 WHERE party_id = ?
    `, [partyId]);
  }

  /**
   * End a watch party
   */
  async endParty(partyId, hostUserId) {
    const parties = await query(`
      SELECT * FROM watch_parties WHERE id = ? AND host_user_id = ?
    `, [partyId, hostUserId]);

    if (parties.length === 0) {
      throw new Error('Only the host can end the party');
    }

    await execute(`
      UPDATE watch_parties
      SET status = 'ended', ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [partyId]);

    // Mark all participants as inactive
    await execute(`
      UPDATE watch_party_participants
      SET is_active = 0, left_at = CURRENT_TIMESTAMP
      WHERE party_id = ?
    `, [partyId]);
  }

  /**
   * Get user's active parties
   */
  async getUserParties(userId) {
    const parties = await query(`
      SELECT
        wp.*,
        m.title as movie_title,
        m.poster_path,
        u.username as host_username,
        (SELECT COUNT(*) FROM watch_party_participants WHERE party_id = wp.id AND is_active = 1) as participant_count
      FROM watch_parties wp
      LEFT JOIN movies m ON wp.movie_id = m.tmdb_id OR wp.movie_id = m.id
      JOIN users u ON wp.host_user_id = u.id
      WHERE wp.host_user_id = ? OR wp.id IN (
        SELECT party_id FROM watch_party_participants WHERE user_id = ? AND is_active = 1
      )
      ORDER BY wp.created_at DESC
    `, [userId, userId]);

    return parties;
  }

  /**
   * Get public parties
   */
  async getPublicParties(limit = 20) {
    const parties = await query(`
      SELECT
        wp.*,
        m.title as movie_title,
        m.poster_path,
        u.username as host_username,
        u.avatar_url as host_avatar,
        (SELECT COUNT(*) FROM watch_party_participants WHERE party_id = wp.id AND is_active = 1) as participant_count
      FROM watch_parties wp
      LEFT JOIN movies m ON wp.movie_id = m.tmdb_id OR wp.movie_id = m.id
      JOIN users u ON wp.host_user_id = u.id
      WHERE wp.is_public = 1 AND wp.status IN ('waiting', 'active')
      ORDER BY wp.created_at DESC
      LIMIT ?
    `, [limit]);

    return parties;
  }

  /**
   * Check if user is participant
   */
  async isParticipant(partyId, userId) {
    const result = await query(`
      SELECT * FROM watch_party_participants
      WHERE party_id = ? AND user_id = ? AND is_active = 1
    `, [partyId, userId]);

    return result.length > 0;
  }

  /**
   * Check if user is host
   */
  async isHost(partyId, userId) {
    const result = await query(`
      SELECT * FROM watch_parties WHERE id = ? AND host_user_id = ?
    `, [partyId, userId]);

    return result.length > 0;
  }
}

export default new WatchPartyService();
