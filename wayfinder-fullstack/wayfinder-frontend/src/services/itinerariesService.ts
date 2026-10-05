import { apiRequest } from './api';
import { UserPreferences } from '../types';

export interface ItineraryStop { targetType: 'place' | 'business'; targetId: string; name: string; arrivalOffsetMin: number; visitDurationMin: number; travelMinFromPrev: number }
export interface Itinerary { _id: string; title: string; availableTimeMin: number; travelMode: string; budget: number; interests: string[]; stops: ItineraryStop[]; totalMinutesUsed: number; createdAt: string }
export async function listItineraries() { return (await apiRequest<{itineraries: Itinerary[]}>('/itineraries')).itineraries; }
export async function createItinerary(body: Pick<UserPreferences, 'availableTimeMin'|'travelMode'|'budget'|'interests'> & {startLat:number; startLng:number; title:string}) { return (await apiRequest<{itinerary:Itinerary}>('/itineraries',{method:'POST',body})).itinerary; }
export async function deleteItinerary(id:string) { await apiRequest(`/itineraries/${id}`,{method:'DELETE'}); }
