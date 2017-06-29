require './chatwork.rb'

chatwork = Chatwork.new

puts "My Information:"
puts chatwork.get_me
puts
puts

puts "Rooms:"
puts chatwork.get_rooms
puts
puts

puts "All Messages:"
puts chatwork.get_all_messages
puts
puts