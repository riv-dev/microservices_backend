require './chatwork.rb'

class ChatworkTaskPuller

  def self.get_new_tasks
      chatwork = Chatwork.new

      tasks = []

      all_room_messages = chatwork.get_all_messages

      all_room_messages.each do |room|
          room_name = room["room_name"]
          messages = room["messages"]

          next unless messages

          messages.each do |message|
            user_name = message["account"]["name"]
            text = message["body"]
            time = Time.at(message["send_time"])

            if /^\s*@task\s+/.match(text)
              puts "Adding a new task!!!"
              tasks << {"name" => "Chatwork Task from #{user_name} in ##{room_name} at #{time.strftime('%c')}", "description" => text}
            end
          end
      end

      return tasks

    end

end