# Travel Concierge

This sample demonstrates the use of Agent Development Kit to deliver a new user experience for Travelers. A cohort of agents mimics the notion of having a personal travel concierge, taking care of a traveler's needs: from trip conception, planning and booking, to preparing for the trip, getting help to get from point A to B during the trip, while simultaneously acting as an informative guide.

This example includes illustrations with ADK supported tools such as Google Places API, Google Search Grounding and MCP.

## Overview

A traveler's experience can be divided into two stages: pre-booking and post-booking. In this example, each stage involves the use of multiple specialized agents working together to provide the concierge experience.

During the pre-booking stage, different agents are constructed to help the traveler with vacation inspirations, activities planning, finding flights and hotels, and helps with booking payment processing. The pre-booking stage ends with an itinerary for a trip.

In the post-booking stage, given a concrete itinerary, a different set of agents support the traveler's needs before, during and after the trip. For example, the pre-trip agent checks for visa and medical requirements, travel advisory, and storm status. The in-trip agent monitors for any changes to bookings, with a day-of agent that helps the traveler getting from A to B during the trip. The post-trip agent helps collect feedback and identify additional preferences for future travel plans.


## RUNNING THIS AGENT
1. `adk api_server travel_concierge`
2. `adk run travel_concierge`
3. `adk web travel_concierge`

## Disclaimer

This agent sample is provided for illustrative purposes only and is not intended for production use. It serves as a basic example of an agent and a foundational starting point for individuals or teams to develop their own agents.

This sample has not been rigorously tested, may contain bugs or limitations, and does not include features or optimizations typically required for a production environment (e.g., robust error handling, security measures, scalability, performance considerations, comprehensive logging, or advanced configuration options).

Users are solely responsible for any further development, testing, security hardening, and deployment of agents based on this sample. We recommend thorough review, testing, and the implementation of appropriate safeguards before using any derived agent in a live or critical system.