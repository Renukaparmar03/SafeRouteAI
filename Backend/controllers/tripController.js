import Trip from '../models/Trip.js';

// @desc    Create a new trip
// @route   POST /api/trips
export const createTrip = async (req, res) => {
  const { source, destination, travelDate, travelMode } = req.body;

  try {
    const trip = new Trip({
      user: req.user._id,
      source,
      destination,
      travelDate,
      travelMode,
    });

    const createdTrip = await trip.save();
    res.status(201).json(createdTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all trips for logged in user
// @route   GET /api/trips
export const getMyTrips = async (req, res) => {
  const { status } = req.query; // optional filter by status (upcoming, ongoing, completed)

  try {
    let query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query).sort({ travelDate: 1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update trip status (e.g., start or complete journey)
// @route   PUT /api/trips/:id/status
export const updateTripStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const trip = await Trip.findById(req.params.id);

    if (trip) {
      // Ensure the trip belongs to the user
      if (trip.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this trip' });
      }

      trip.status = status;
      const updatedTrip = await trip.save();
      res.json(updatedTrip);
    } else {
      res.status(404).json({ message: 'Trip not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a trip
// @route   DELETE /api/trips/:id
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (trip) {
      if (trip.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this trip' });
      }

      await trip.deleteOne();
      res.json({ message: 'Trip removed' });
    } else {
      res.status(404).json({ message: 'Trip not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
