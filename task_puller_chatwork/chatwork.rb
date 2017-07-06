#Chatwork wrapper
require 'net/http'
require 'net/https'
require 'uri'
require './credentials.rb'
require 'json'

class Chatwork
    def initialize
        @rooms_hash = {}
    end

    def get_request(relative_uri)
        @uri = URI.parse("https://api.chatwork.com/v2#{relative_uri}")

        @https = Net::HTTP.new(@uri.host,@uri.port)
        @https.use_ssl = true

        @my_get_request = Net::HTTP::Get.new(@uri.path)
        @my_get_request.add_field("X-ChatWorkToken", Credentials.chatwork_token)

        @response = @https.request(@my_get_request)

        if @response.body
            return JSON.parse(@response.body)
        else
            return nil
        end
    end

    def get_me
        return get_request("/me")
    end

    def get_rooms
        rooms = get_request("/rooms")

        #Hash for faster future searching
        rooms.each do |room|
            @rooms_hash[room["room_id"]] = room["name"]
        end

        return rooms
    end

    def get_room(room_id)
        return get_request("/rooms/#{room_id}")
    end

    def get_room_members(room_id)
        return get_request("/rooms/#{room_id}/members")
    end

    def get_room_messages(room_id)
        return get_request("/rooms/#{room_id}/messages")
    end

    def get_room_message(room_id, message_id)
        return get_request("/rooms/#{room_id}/messages/#{message_id}")
    end

    def get_room_tasks(room_id)
        return get_request("/rooms/#{room_id}/tasks")
    end

    def get_all_messages
        rooms = get_rooms

        messages = []

        rooms.each do |room|
            room_id = room["room_id"] 
            room_name = @rooms_hash[room_id]
            room_messages = get_room_messages(room_id)
            messages.push({"room_id" => room_id, "room_name" => room_name, "messages" => room_messages})
        end

        return messages
    end

    def get_all_tasks
        rooms = get_rooms

        tasks = []

        rooms.each do |room|
            room_id = room["room_id"] 
            room_name = @rooms_hash[room_id]
            room_tasks = get_room_tasks(room_id)
            tasks.push({"room_id" => room_id, "room_name" => room_name, "tasks" => room_tasks})
        end

        return tasks
    end

end