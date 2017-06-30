require './chatwork.rb'

class ChatworkTaskPuller

  def self.get_new_tasks
      chatwork = Chatwork.new

      tasks = []

      all_room_messages = chatwork.get_all_messages

      all_room_messages.each do |room|
          room_id = room["room_id"]
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
            elsif results = /\[info\]\[title\]\[dtext:task_added\]\[\/title\]\[task\said=\d+.*?\slt=(\d+)\](.*)?\[\/task\]/m.match(text.gsub(/\n/,''))
              task_description = results[2]
              task_deadline = results[1]
            #  task_id = nil
              #Find the ID of the task
              #Get all the tasks in the room
            #  all_room_tasks = chatwork.get_room_tasks(room_id)
              #Search for the task ID
            #  all_room_tasks.each do |room_task|
            #    if room_task["body"] == task_description  
            #      task_id = room_task["task_id"]
            #    end
            #  end
              tasks << {"name" => "Chatwork Task from #{user_name} in ##{room_name} at #{time.strftime('%c')}", "description" => task_description, "deadline" => Time.at(task_deadline.to_f).strftime('%Y-%m-%d %H:%M:%S')}
              puts "Adding a new task!!!"
            #elsif results = /\[info\]\[title\]\[dtext:task_done\]\[\/title\]\[task\said=\d+.*?\slt=(\d+)\](.*)?\[\/task\]/m.match(text.gsub(/\n/,''))
            #  task_description = results[2]
            #  task_deadline = results[1]
            #  task_id = nil
            #  #Find the ID of the task
            #  #Get all the tasks in the room
            #  all_room_tasks = chatwork.get_room_tasks(room_id)
            #  #Search for the task ID
            #  all_room_tasks.each do |room_task|
            #    if room_task["body"] == task_description  
            #      task_id = room_task["task_id"]
            #    end
            #  end
            #  tasks << {"name" => "Chatwork Task[#{task_id}] from #{user_name} in ##{room_name} at #{time.strftime('%c')}", "description" => task_description, "deadline" => Time.at(task_deadline.to_f).strftime('%Y-%m-%d %H:%M:%S'), "status" => "finished"}
            #  puts "Task status update found!"
            #end
          end
      end

      return tasks

    end

end